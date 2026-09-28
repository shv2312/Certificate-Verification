"""
SIET Academic Background Verification Portal
Verification Engine — matcher.py

Owner: Parthiban V
Date: 2026-09-02

PURPOSE:
    Field-by-field comparison of normalized HR input against an official
    student record retrieved from the database.

MATCHING POLICY:
    ALL five fields must match for VERIFIED status:
        1. register_number — already matched by the SQL lookup (primary key)
        2. full_name_normalized — uppercase, whitespace-collapsed comparison
        3. branch_id — exact integer match (resolved via alias table)
        4. year_of_passing — exact integer match

    ANY mismatch → NOT_VERIFIED.

PRIVACY RULE:
    The comparison result reveals ONLY the final status (VERIFIED / NOT_VERIFIED).
    It does NOT expose:
        - Which field(s) failed.
        - What the official database value was.
        - Any partial information about the student record.

    This prevents information leakage on failed verifications.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    NAME_MISMATCH = "NAME_MISMATCH"
    NOT_FOUND = "NOT_FOUND"


@dataclass
class StudentRecord:
    """
    Represents an official student record retrieved from the database.
    Only the fields required for verification are included.
    This object must NEVER be serialized and sent to the HR client.
    """
    student_id: int
    register_number: str
    full_name_normalized: str   # Pre-computed normalized form stored in DB
    branch_id: int
    year_of_passing: int


@dataclass
class MatchResult:
    """
    Result of a record comparison. Contains only the status.

    Privacy guarantee:
        - status: always present (VERIFIED or NOT_VERIFIED)
        - student_id: present ONLY when VERIFIED (for internal use)
        - No field-level failure information is included
    """
    status: VerificationStatus
    student_id: Optional[int] = None  # Only set when VERIFIED

    @property
    def is_verified(self) -> bool:
        return self.status == VerificationStatus.VERIFIED


def compare_records(
    normalized_register_number: str,
    normalized_name: str,
    official_record: StudentRecord,
) -> MatchResult:
    """
    Compare normalized HR input against the official student record.

    Only name and register_number are compared (minimal zero-trust payload).

    Args:
        normalized_register_number: From normalizer.normalize_register_number()
        normalized_name:            From normalizer.normalize_candidate_name()
        official_record:            StudentRecord retrieved from PostgreSQL

    Returns:
        MatchResult with status VERIFIED, NAME_MISMATCH, or NOT_FOUND.
        student_id is set only on VERIFIED.
    """
    # Defense-in-depth: confirm register number matches
    if normalized_register_number != official_record.register_number.strip().upper():
        return MatchResult(status=VerificationStatus.NOT_FOUND)

    # Name comparison: both sides are normalized to uppercase collapsed form
    if normalized_name != official_record.full_name_normalized:
        return MatchResult(status=VerificationStatus.NAME_MISMATCH)

    # All fields match
    return MatchResult(
        status=VerificationStatus.VERIFIED,
        student_id=official_record.student_id,
    )


def handle_record_not_found() -> MatchResult:
    """
    Returns a NOT_FOUND result when the register number is not found
    in the database.
    """
    return MatchResult(status=VerificationStatus.NOT_FOUND)
