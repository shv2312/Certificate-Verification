"""
SIET Academic Background Verification Portal
Verification Engine — engine.py

Owner: Parthiban V
Date: 2026-09-02

PURPOSE:
    Orchestration layer. Combines normalizer → lookup → matcher.
    This is the entry point that Shri Hari's FastAPI backend calls.

INTEGRATION POINT:
    See docs/VERIFICATION_ENGINE_CONTRACT.md for the full API contract.

    The backend passes a VerificationRequest object.
    The engine returns a VerificationOutcome.

IMPORTANT:
    The database connection / query layer is injected as a callable
    (student_lookup_fn and alias_map). This keeps the engine testable
    without a live database and ORM-agnostic.

    Shri Hari's backend will provide the actual database session.
    The engine does not import SQLAlchemy/psycopg2 directly — the
    technology choice belongs to the backend.

VERIFICATION FLOW:
    1. Validate all inputs
    2. Normalize all inputs
    3. Resolve branch alias → branch_id
    4. Look up student by register_number (exact, parameterized)
    5. If not found → NOT_VERIFIED
    6. If found → compare all required fields
    7. If all match → VERIFIED
    8. If any mismatch → NOT_VERIFIED
    9. Return VerificationOutcome (status only — no field leak)
"""

from dataclasses import dataclass, field as datafield
from typing import Optional, Callable, List, Awaitable
from enum import Enum

from .normalizer import validate_and_normalize, ValidationError
from .matcher import (
    compare_records,
    handle_record_not_found,
    StudentRecord,
    VerificationStatus,
    MatchResult,
)


# ---------------------------------------------------------------------------
# Input / Output Data Contracts
# ---------------------------------------------------------------------------

@dataclass
class VerificationRequest:
    """
    HR-submitted candidate data.
    All fields are raw strings exactly as submitted via the API.
    """
    request_id: str               # UUID from verification_requests table
    register_number: str
    candidate_name: str
    branch: str                   # Raw HR input (e.g. "CSE", "Computer Science")
    year_of_passing: object       # int or string; normalized internally


@dataclass
class VerificationOutcome:
    """
    Final result returned to Shri Hari's FastAPI backend.

    Fields:
        request_id:   Echo of the input request ID.
        status:       "VERIFIED" or "NOT_VERIFIED" only.
        student_id:   Internal DB ID — present only when VERIFIED.
                      Backend uses this to fetch authorized report data.
        errors:       Non-empty only when INPUT VALIDATION fails (before DB hit).
                      Never contains database mismatch information.
        engine_version: For audit/reproducibility.

    PRIVACY:
        On NOT_VERIFIED, no information about which field failed or what
        the official record contains is included.
    """
    request_id: str
    status: str                           # "VERIFIED" | "NOT_VERIFIED" | "INVALID_INPUT"
    student_id: Optional[int] = None
    errors: List[ValidationError] = datafield(default_factory=list)
    engine_version: str = "1.0"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class VerificationEngine:
    """
    The verification engine.

    Usage (from Shri Hari's backend):

        engine = VerificationEngine(
            alias_map=load_alias_map_from_db(db_session),
            student_lookup_fn=lambda reg_num: fetch_student(db_session, reg_num),
        )
        outcome = engine.verify(request)

    The alias_map and student_lookup_fn are injected to keep the engine
    ORM-agnostic and testable.
    """

    def __init__(
        self,
        alias_map: dict,
        student_lookup_fn: Callable[[str], Awaitable[Optional[StudentRecord]]],
    ):
        """
        Args:
            alias_map:
                Dict mapping UPPERCASE alias strings → branch info.
                Expected:
                {
                    "CSE": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
                    ...
                }
                Load this from the branch_aliases table at startup or per-request.

            student_lookup_fn:
                Callable that takes a normalized register_number (str) and
                returns a StudentRecord if found, or None if not found.
                Implemented by Shri Hari's backend using the project's DB layer.
                Must use parameterized queries (no string interpolation).
        """
        self._alias_map = alias_map
        self._lookup = student_lookup_fn

    async def verify(self, request: VerificationRequest) -> VerificationOutcome:
        """
        Run the full verification flow for a candidate.

        Returns:
            VerificationOutcome with status VERIFIED, NOT_VERIFIED, or INVALID_INPUT.
        """
        # -------------------------------------------------------------------
        # Step 1: Validate and normalize all HR inputs
        # -------------------------------------------------------------------
        normalized, validation_errors = validate_and_normalize(
            raw_register_number=request.register_number,
            raw_name=request.candidate_name,
            raw_branch=request.branch,
            raw_year_of_passing=request.year_of_passing,
            alias_map=self._alias_map,
        )

        if validation_errors:
            # Input is malformed. Return INVALID_INPUT — not a DB miss.
            # Backend should NOT record a verification attempt for invalid input.
            return VerificationOutcome(
                request_id=request.request_id,
                status="INVALID_INPUT",
                errors=validation_errors,
            )

        # -------------------------------------------------------------------
        # Step 2: Look up student by register number (exact, parameterized)
        # -------------------------------------------------------------------
        official_record: Optional[StudentRecord] = await self._lookup(
            normalized.register_number
        )

        # -------------------------------------------------------------------
        # Step 3: If not found → NOT_VERIFIED (no information leakage)
        # -------------------------------------------------------------------
        if official_record is None:
            result: MatchResult = handle_record_not_found()
            return VerificationOutcome(
                request_id=request.request_id,
                status=result.status.value,
            )

        # -------------------------------------------------------------------
        # Step 4: Compare all required fields
        # -------------------------------------------------------------------
        result = compare_records(
            normalized_register_number=normalized.register_number,
            normalized_name=normalized.name_normalized,
            resolved_branch_id=normalized.branch_id,
            normalized_year=normalized.year_of_passing,
            official_record=official_record,
        )

        # -------------------------------------------------------------------
        # Step 5: Return outcome
        # student_id is included only on VERIFIED (for report generation).
        # No field-level failure detail is ever included.
        # -------------------------------------------------------------------
        return VerificationOutcome(
            request_id=request.request_id,
            status=result.status.value,
            student_id=result.student_id,
        )


# ---------------------------------------------------------------------------
# Helper: Load alias map from the database
# (Reference implementation — backend adapts this to its ORM)
# ---------------------------------------------------------------------------

def build_alias_map_from_rows(alias_rows) -> dict:
    """
    Build the alias_map dict from database rows.

    Args:
        alias_rows: Iterable of objects/dicts with fields:
                    alias (str), branch_id (int), branch_full_name (str)

    Returns:
        Dict mapping UPPERCASE alias → {"branch_id": int, "canonical_name": str}

    Example SQL to fetch alias_rows (backend uses its own ORM/query layer):
        SELECT ba.alias, ba.branch_id, b.full_name AS branch_full_name
        FROM branch_aliases ba
        JOIN branches b ON b.id = ba.branch_id
        WHERE b.is_active = TRUE;
    """
    alias_map = {}
    for row in alias_rows:
        # Support both dict-like and attribute-like rows
        if isinstance(row, dict):
            alias = row["alias"]
            branch_id = row["branch_id"]
            canonical_name = row.get("branch_full_name", "")
        else:
            alias = row.alias
            branch_id = row.branch_id
            canonical_name = getattr(row, "branch_full_name", "")

        alias_map[alias.strip().upper()] = {
            "branch_id": branch_id,
            "canonical_name": canonical_name,
        }

    return alias_map
