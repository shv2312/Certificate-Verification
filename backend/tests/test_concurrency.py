import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.config import get_settings

DATABASE_URL = get_settings().DATABASE_URL.replace("postgresql+asyncpg", "postgresql+asyncpg")
# Use test db if testing
if "siet_bgv" in DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:root@localhost:5432/siet_test"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def bind_candidate_transaction(request_id: str, candidate_name: str):
    async with AsyncSessionLocal() as session:
        try:
            # Replicating the bind_candidate logic:
            query = text("""
                UPDATE verification_requests
                SET 
                    hr_submitted_name = :name,
                    status = 'CANDIDATE_BOUND'
                WHERE id = :id AND status = 'PAID_UNUSED'
                RETURNING id
            """)
            result = await session.execute(query, {"id": request_id, "name": candidate_name})
            row = result.fetchone()
            if not row:
                raise ValueError("Row not found or already bound")
            
            # Simulate some processing delay to increase race condition window
            await asyncio.sleep(0.5)

            await session.commit()
            return "SUCCESS"
        except Exception as e:
            await session.rollback()
            return str(e)

@pytest.mark.asyncio
@pytest.mark.skipif(
    get_settings().DATABASE_URL.startswith("sqlite"),
    reason="Concurrency test requires PostgreSQL (uses PG-specific SQL: RETURNING, extract, ::bigint)"
)
async def test_concurrent_bind_candidate():
    # Setup test data
    async with AsyncSessionLocal() as session:
        # cleanup first
        await session.execute(text("DELETE FROM verification_requests WHERE id = 'req_concurrency_test'"))
        
        insert_query = text("""
            INSERT INTO verification_requests (
                id, display_request_id, payment_session_id, company_name, hr_email, 
                status, created_at
            ) VALUES (
                'req_concurrency_test', 'SIET-CONC-01', 'pay_conc_01', 'Tech Corp', 'hr@test.com',
                'PAID_UNUSED', extract(epoch from now())::bigint
            )
        """)
        await session.execute(insert_query)
        await session.commit()

    # Run two concurrent tasks
    task1 = bind_candidate_transaction('req_concurrency_test', 'Candidate 1')
    task2 = bind_candidate_transaction('req_concurrency_test', 'Candidate 2')

    results = await asyncio.gather(task1, task2)
    
    # Assert exactly one succeeded
    successes = [r for r in results if r == "SUCCESS"]
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}. Results: {results}"
    
    # Assert the other failed
    failures = [r for r in results if r != "SUCCESS"]
    assert len(failures) == 1
    assert "ValueError" in str(failures[0]) or "already bound" in str(failures[0])
