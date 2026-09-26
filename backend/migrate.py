import asyncio
from app.config import get_settings
from app.db.session import engine
from sqlalchemy import text

async def run_migrations():
    async with engine.begin() as conn:
        print("Running migrations to add new columns...")
        
        # Add to VerificationRequest
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN institution_id VARCHAR(64)"))
            await conn.execute(text("ALTER TABLE verification_requests ADD CONSTRAINT fk_vr_inst FOREIGN KEY (institution_id) REFERENCES institutions(id)"))
            await conn.execute(text("CREATE INDEX ix_vr_inst_id ON verification_requests (institution_id)"))
        except Exception as e:
            print(f"Skipping verification_requests.institution_id: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN certificate_url VARCHAR(1024)"))
        except Exception as e:
            print(f"Skipping certificate_url: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN admin_decision VARCHAR(32) DEFAULT 'PENDING_REVIEW' NOT NULL"))
        except Exception as e:
            print(f"Skipping admin_decision: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN admin_remarks TEXT"))
        except Exception as e:
            print(f"Skipping admin_remarks: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE"))
        except Exception as e:
            print(f"Skipping reviewed_at: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE verification_requests ADD COLUMN reviewed_by VARCHAR(255)"))
        except Exception as e:
            print(f"Skipping reviewed_by: {e}")

        # Add to Student
        try:
            await conn.execute(text("ALTER TABLE students ADD COLUMN institution_id VARCHAR(64)"))
            await conn.execute(text("ALTER TABLE students ADD CONSTRAINT fk_student_inst FOREIGN KEY (institution_id) REFERENCES institutions(id)"))
            await conn.execute(text("CREATE INDEX ix_student_inst_id ON students (institution_id)"))
        except Exception as e:
            print(f"Skipping students.institution_id: {e}")

asyncio.run(run_migrations())
