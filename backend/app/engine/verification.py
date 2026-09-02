import logging
import asyncio
from dataclasses import dataclass
from typing import Optional

from app.config import get_settings

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


async def verify_candidate(
    candidate_name: str,
    register_number: str,
    course: str,
    branch: str,
    year_of_passing: int,
) -> VerificationResult:
    """
    Engine interface for verifying a candidate's background against the institution's DB.
    
    This function currently mocks the behavior if DEV_MOCK_VERIFICATION is enabled.
    Otherwise, it raises NotImplementedError pending Parthiban's database setup.
    """
    if settings.DEV_MOCK_VERIFICATION:
        logger.warning(
            "[DEV] DEV_MOCK_VERIFICATION is enabled. "
            "Verification engine will always return a VERIFIED response. "
            "DISABLE before any production deployment."
        )
        # Simulate engine latency
        await asyncio.sleep(1.0)
        
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
    
    raise NotImplementedError(
        "Verification engine not yet integrated. "
        "Awaiting Parthiban's database/verification engine implementation. "
        "See docs/db_contract.md for the required interface."
    )
