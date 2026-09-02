import logging
import asyncio
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.config import get_settings
from verification_engine.engine import VerificationEngine, VerificationRequest as EngineRequest
from verification_engine.lookup import load_alias_map, lookup_student_by_register_number

@dataclass
class VerificationResult:
    status: str  # "VERIFIED" | "NOT_VERIFIED"
    candidate_name: Optional[str] = None
    university_name: Optional[str] = None
    institute_name: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    register_number: Optional[str] = None
    year_of_passing: Optional[int] = None
    backlog_status: Optional[str] = None
    period_of_study: Optional[str] = None
    mode_of_education: Optional[str] = None




async def verify_candidate(
    db: AsyncSession,
    candidate_name: str,
    register_number: str,
    course: str,
    branch: str,
    year_of_passing: int,
) -> VerificationResult:
    """
    Engine interface for verifying a candidate's background against the institution's DB.
    
    This function uses Parthiban's VerificationEngine using the live AsyncSession.
    """
    alias_map = await load_alias_map(db)

    # Use a closure or partial to pass the db session to the lookup function
    async def student_lookup_fn(reg_num: str):
        return await lookup_student_by_register_number(db, reg_num)

    engine = VerificationEngine(
        alias_map=alias_map,
        student_lookup_fn=student_lookup_fn
    )

    req = EngineRequest(
        request_id="dummy-req-id",  # Request ID is not used for matching logic
        register_number=register_number,
        candidate_name=candidate_name,
        branch=branch,
        year_of_passing=year_of_passing
    )

    outcome = await engine.verify(req)

    # If verification is successful, query the DB for the full student record
    if outcome.status == "VERIFIED" and outcome.student_id:
        query = text("""
            SELECT 
                s.register_number, 
                s.full_name, 
                s.year_of_passing, 
                s.university_name, 
                s.institute_name, 
                s.period_of_study_start, 
                s.period_of_study_end, 
                s.mode_of_education, 
                s.has_arrear,
                b.full_name AS branch_name,
                p.full_name AS course_name
            FROM students s
            JOIN branches b ON s.branch_id = b.id
            JOIN programmes p ON b.programme_id = p.id
            WHERE s.id = :student_id
        """)
        result = await db.execute(query, {"student_id": outcome.student_id})
        row = result.fetchone()
        
        if row:
            row_dict = row._mapping
            start = row_dict["period_of_study_start"]
            end = row_dict["period_of_study_end"]
            period = f"{start}-{end}" if start and end else None
            backlog = "HAS ARREARS" if row_dict["has_arrear"] else "NO BACKLOGS"
            
            return VerificationResult(
                status="VERIFIED",
                candidate_name=row_dict["full_name"],
                university_name=row_dict["university_name"],
                institute_name=row_dict["institute_name"],
                course=row_dict["course_name"],
                branch=row_dict["branch_name"],
                register_number=row_dict["register_number"],
                year_of_passing=row_dict["year_of_passing"],
                backlog_status=backlog,
                period_of_study=period,
                mode_of_education=row_dict["mode_of_education"] or "FULL TIME"
            )
    
    # Otherwise return NOT_VERIFIED
    # Note: NOT_VERIFIED does not expose any database fields, respecting the privacy rule.
    return VerificationResult(
        status="NOT_VERIFIED"
    )
