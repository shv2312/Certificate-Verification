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
    NOT_VERIFIED = "NOT_VERIFIED"


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
    resolved_branch_id: int,
    normalized_year: int,
    official_record: StudentRecord,
) -> MatchResult:
    """
    Compare normalized HR input against the official student record.

    All fields must match exactly for a VERIFIED result.
    Any mismatch → NOT_VERIFIED (no detail about which field failed).

    The register number is the primary lookup key — the official record was
    fetched using it. We re-confirm it here for defense-in-depth.

    Args:
        normalized_register_number: From normalizer.normalize_register_number()
        normalized_name:            From normalizer.normalize_candidate_name()
        resolved_branch_id:         From normalizer.resolve_branch_alias()
        normalized_year:            From normalizer.normalize_year_of_passing()
        official_record:            StudentRecord retrieved from PostgreSQL

    Returns:
        MatchResult with status VERIFIED or NOT_VERIFIED.
        student_id is set only on VERIFIED.
    """
    # Defense-in-depth: confirm register number matches (should always be true
    # since we fetched by register_number, but we check anyway)
    if normalized_register_number != official_record.register_number.strip().upper():
        return MatchResult(status=VerificationStatus.NOT_VERIFIED)

    # Name comparison: both sides are normalized to uppercase collapsed form
    if normalized_name != official_record.full_name_normalized:
        return MatchResult(status=VerificationStatus.NOT_VERIFIED)

    # Branch comparison: exact integer ID match (resolved via alias table)
    if resolved_branch_id != official_record.branch_id:
        return MatchResult(status=VerificationStatus.NOT_VERIFIED)

    # Year of passing: exact integer match
    if normalized_year != official_record.year_of_passing:
        return MatchResult(status=VerificationStatus.NOT_VERIFIED)

    # All fields match
    return MatchResult(
        status=VerificationStatus.VERIFIED,
        student_id=official_record.student_id,
    )


def handle_record_not_found() -> MatchResult:
    """
    Returns a NOT_VERIFIED result when the register number is not found
    in the database.

    This is a separate function to make the intent explicit and avoid
    accidentally leaking the reason (record not found vs field mismatch).
    The caller receives the same NOT_VERIFIED result either way.
    """
    return MatchResult(status=VerificationStatus.NOT_VERIFIED)
