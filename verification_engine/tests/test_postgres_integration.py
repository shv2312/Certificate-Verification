import pytest
import pytest_asyncio
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import NullPool
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from verification_engine.lookup import load_alias_map, lookup_student_by_register_number
from verification_engine.engine import VerificationEngine, VerificationRequest, VerificationStatus

# Ensure we use test DB, falling back to localhost with root password
DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://postgres:root@localhost:5432/siet_test")

engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest.mark.asyncio
async def test_postgres_load_alias_map(db_session):
    alias_map = await load_alias_map(db_session)
    assert len(alias_map) > 0
    assert "CSE" in alias_map
    assert alias_map["CSE"]["canonical_name"] == "Computer Science and Engineering"


@pytest.mark.asyncio
async def test_postgres_lookup_student_found(db_session):
    student = await lookup_student_by_register_number(db_session, "911021104001")
    assert student is not None
    assert student.register_number == "911021104001"
    assert student.full_name_normalized == "TEST STUDENT ALPHA"
    assert student.year_of_passing == 2024


@pytest.mark.asyncio
async def test_postgres_lookup_student_not_found(db_session):
    student = await lookup_student_by_register_number(db_session, "999999999999")
    assert student is None


@pytest.mark.asyncio
async def test_engine_postgres_integration_match(db_session):
    alias_map = await load_alias_map(db_session)

    async def db_lookup(reg_num):
        return await lookup_student_by_register_number(db_session, reg_num)

    ve = VerificationEngine(alias_map=alias_map, student_lookup_fn=db_lookup)
    
    # Matching candidate
    req = VerificationRequest(
        request_id="req_001_match",
        register_number="911021104001",
        candidate_name="TEST STUDENT ALPHA",
        branch="CSE",
        year_of_passing=2024
    )
    
    result = await ve.verify(req)
    assert result.status == VerificationStatus.VERIFIED
    assert result.student_id is not None
    assert not result.errors


@pytest.mark.asyncio
async def test_engine_postgres_integration_mismatch(db_session):
    alias_map = await load_alias_map(db_session)

    async def db_lookup(reg_num):
        return await lookup_student_by_register_number(db_session, reg_num)

    ve = VerificationEngine(alias_map=alias_map, student_lookup_fn=db_lookup)
    
    # Mismatch candidate (wrong name)
    req = VerificationRequest(
        request_id="req_002_mismatch",
        register_number="911021104001",
        candidate_name="TEST STUDENT WRONG NAME",
        branch="CSE",
        year_of_passing=2024
    )
    
    result = await ve.verify(req)
    assert result.status == VerificationStatus.NOT_VERIFIED
    assert result.student_id is None # No data leakage
    assert not result.errors


@pytest.mark.asyncio
async def test_postgres_transaction_one_payment_one_candidate(db_session):
    # Try inserting a duplicate payment_session_id
    query = text("""
        INSERT INTO verification_requests (
            id, display_request_id, payment_session_id, company_name, hr_email, 
            status, created_at
        ) VALUES (
            'req_duplicate', 'SIET-9999', 'pay_001', 'Tech Corp', 'hr@test.com',
            'PAID_UNUSED', 1700000005
        )
    """)
    
    with pytest.raises(IntegrityError) as exc_info:
        await db_session.execute(query)
        await db_session.commit()
    
    assert "duplicate key value violates unique constraint" in str(exc_info.value)
    await db_session.rollback()


@pytest.mark.asyncio
async def test_postgres_cross_user_denial_of_access(db_session):
    # Verify that we can filter requests securely by owner_id
    query_a = text("""
        SELECT id FROM verification_requests 
        WHERE owner_id = (SELECT id FROM admin_accounts WHERE email='hr_a@siet.ac.in')
    """)
    result_a = await db_session.execute(query_a)
    requests_a = [r[0] for r in result_a.fetchall()]
    
    assert "req_001_match" in requests_a
    assert "req_003_unknown" in requests_a
    assert "req_002_mismatch" not in requests_a # Belongs to hr_b

    query_b = text("""
        SELECT id FROM verification_requests 
        WHERE owner_id = (SELECT id FROM admin_accounts WHERE email='hr_b@siet.ac.in')
    """)
    result_b = await db_session.execute(query_b)
    requests_b = [r[0] for r in result_b.fetchall()]
    
    assert "req_002_mismatch" in requests_b
    assert "req_001_match" not in requests_b
