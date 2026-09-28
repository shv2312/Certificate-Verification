import asyncio
import os
from app.config import get_settings
from app.db.session import engine, Base
import app.db.models
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, text
from app.db.models import Institution, Student

async def init():
    async with engine.begin() as conn:
        # Create tables that don't exist yet (e.g. institutions)
        await conn.run_sync(Base.metadata.create_all)
        
        print("Running schema updates...")
        
        # Add to VerificationRequest
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN institution_id VARCHAR(64)"))
            await conn.execute(text("ALTER TABLE verification_requests ADD CONSTRAINT fk_vr_inst FOREIGN KEY (institution_id) REFERENCES institutions(id)"))
            await conn.execute(text("CREATE INDEX ix_vr_inst_id ON verification_requests (institution_id)"))
        except Exception as e:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN certificate_url VARCHAR(1024)"))
        except Exception as e:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN admin_decision VARCHAR(32) DEFAULT 'PENDING_REVIEW' NOT NULL"))
        except Exception as e:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN admin_remarks TEXT"))
        except Exception as e:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE"))
        except Exception as e:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN reviewed_by VARCHAR(255)"))
        except Exception as e:
            pass

        # Add to Student
        try:
            await conn.execute(text("ALTER TABLE students ADD COLUMN institution_id VARCHAR(64)"))
            await conn.execute(text("ALTER TABLE students ADD CONSTRAINT fk_student_inst FOREIGN KEY (institution_id) REFERENCES institutions(id)"))
            await conn.execute(text("CREATE INDEX ix_student_inst_id ON students (institution_id)"))
        except Exception as e:
            pass
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Seed default institution
        result = await session.execute(select(Institution).where(Institution.id == "siet-cbe"))
        inst = result.scalar_one_or_none()
        if not inst:
            inst = Institution(
                id="siet-cbe",
                name="Sri Shakthi Institute of Engineering and Technology",
                code="SIET",
                admin_email="admin@siet.ac.in",
                is_active=True
            )
            session.add(inst)
            
        # Link existing demo student records to 'siet-cbe'
        await session.execute(
            update(Student)
            .where(Student.institution_id == None)
            .values(institution_id="siet-cbe")
        )
        
        await session.commit()

asyncio.run(init())
print("Database initialized.")
