import logging
import asyncio
from dataclasses import dataclass
from typing import Optional

from app.config import get_settings
from verification_engine.engine import VerificationEngine, VerificationRequest as EngineRequest
from verification_engine.matcher import StudentRecord

logger = logging.getLogger(__name__)
settings = get_settings()

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


# Dummy data for Sprint 2 Integration matching test_data.sql
DUMMY_ALIAS_MAP = {
    "CSE": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
    "ECE": {"branch_id": 2, "canonical_name": "Electronics and Communication Engineering"},
    "MECH": {"branch_id": 3, "canonical_name": "Mechanical Engineering"},
    "EEE": {"branch_id": 4, "canonical_name": "Electrical and Electronics Engineering"},
    "IT": {"branch_id": 5, "canonical_name": "Information Technology"},
}

DUMMY_STUDENTS = {
    "911021104001": StudentRecord(student_id=1, register_number="911021104001", full_name_normalized="TEST STUDENT ALPHA", branch_id=1, year_of_passing=2024),
    "911021104002": StudentRecord(student_id=2, register_number="911021104002", full_name_normalized="TEST STUDENT BETA", branch_id=2, year_of_passing=2024),
    "911021104003": StudentRecord(student_id=3, register_number="911021104003", full_name_normalized="TEST STUDENT GAMMA", branch_id=3, year_of_passing=2023),
    "911021104004": StudentRecord(student_id=4, register_number="911021104004", full_name_normalized="TEST STUDENT DELTA", branch_id=4, year_of_passing=2022),
    "911021104005": StudentRecord(student_id=5, register_number="911021104005", full_name_normalized="TEST STUDENT EPSILON", branch_id=5, year_of_passing=2021),
}

def dummy_lookup(reg_num: str) -> Optional[StudentRecord]:
    return DUMMY_STUDENTS.get(reg_num)


async def verify_candidate(
    candidate_name: str,
    register_number: str,
    course: str,
    branch: str,
    year_of_passing: int,
) -> VerificationResult:
    """
    Engine interface for verifying a candidate's background against the institution's DB.
    
    This function uses Parthiban's VerificationEngine. Since PostgreSQL is not yet 
    wired in Sprint 2 integration, it uses a dummy lookup function with test data.
    """
    engine = VerificationEngine(
        alias_map=DUMMY_ALIAS_MAP,
        student_lookup_fn=dummy_lookup
    )

    req = EngineRequest(
        request_id="dummy-req-id",  # Request ID is not used for matching logic
        register_number=register_number,
        candidate_name=candidate_name,
        branch=branch,
        year_of_passing=year_of_passing
    )

    outcome = engine.verify(req)

    # If verification is successful, populate the report data.
    # In production, this would query the DB for the full student record using outcome.student_id.
    if outcome.status == "VERIFIED":
        # Simulate fetching full record from DB using outcome.student_id
        return VerificationResult(
            status="VERIFIED",
            candidate_name=candidate_name.upper(),
            university_name="Sri Shakthi Institute of Engineering and Technology",
            institute_name="SIET",
            course=course.upper(),
            branch=branch.upper(),
            register_number=register_number.upper(),
            year_of_passing=year_of_passing,
            backlog_status="NO BACKLOGS",
            period_of_study=f"{year_of_passing - 4}-{year_of_passing}",
            mode_of_education="FULL TIME"
        )
    
    # Otherwise return NOT_VERIFIED (or INVALID_INPUT treated as NOT_VERIFIED for privacy)
    return VerificationResult(
        status="NOT_VERIFIED"
    )
