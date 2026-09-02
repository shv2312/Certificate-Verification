"""
app/services/verification_service.py
======================================
Candidate verification service.

This service is the integration point between the FastAPI backend
(Shri Hari) and the verification engine + PostgreSQL (Parthiban).

Sprint 1 status:
  - The public interface is DEFINED (function signatures + docstrings).
  - The in-process state machine for bind/confirm is IMPLEMENTED using
    the in-process payment store from payment_service.
  - The actual call to Parthiban's verification engine is a STUB that
    raises NotImplementedError until the database integration contract
    is established.

INTEGRATION CONTRACT WITH PARTHIBAN:
  Parthiban's verification engine must provide a function (or service)
  that accepts:
      candidate_name:   str
      register_number:  str
      course:           str
      branch:           str
      year_of_passing:  int

  And returns one of:
    VerificationMatch (dataclass or Pydantic model) with:
        status:           "VERIFIED" | "NOT_VERIFIED"
        candidate_name:   str | None
        university_name:  str | None
        institute_name:   str | None
        course:           str | None
        branch:           str | None
        register_number:  str | None
        year_of_passing:  int | None
        backlog_status:   str | None
        period_of_study:  str | None
        mode_of_education: str | None

  All values in the match MUST originate from authoritative DB records.
  The backend will NEVER fabricate or default these values.

CONCURRENCY NOTE:
  The bind_candidate and confirm_verification steps must eventually be
  protected by database-level transactions and unique constraints so
  two simultaneous requests cannot consume the same payment for two
  different candidates.  This is documented here as a requirement for
  Parthiban's PostgreSQL design.  Sprint 1 in-process store does not
  guarantee this in a multi-worker deployment.

ONE-PAYMENT-ONE-CANDIDATE ENFORCEMENT:
  Enforced in bind_candidate:
    - Request must be in PAID_UNUSED state.
    - After bind, state transitions to CANDIDATE_BOUND.
  Enforced in confirm_verification:
    - Request must be in CANDIDATE_BOUND state.
    - After confirm, state transitions to VERIFICATION_IN_PROGRESS.
  Even if verification fails (NOT_VERIFIED), state moves to COMPLETED.
  The payment cannot be reused.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, Optional

from app.config import get_settings
from app.schemas.verification import (
    BindCandidateRequest,
    BindCandidateResponse,
    CandidateDetails,
    ConfirmVerificationRequest,
    VerificationResultResponse,
    VerificationStatusResponse,
)
from app.services.payment_service import RequestStatus, get_session_by_request_id

logger = logging.getLogger(__name__)
settings = get_settings()


# ------------------------------------------------------------------ #
# In-process verification request store (Sprint 1 only)              #
# ------------------------------------------------------------------ #
@dataclass
class _VerificationRequest:
    verification_request_id: str
    display_request_id: str
    company_name: str
    hr_email: str
    status: str
    candidate: Optional[CandidateDetails] = None


_verification_store: Dict[str, _VerificationRequest] = {}


# ------------------------------------------------------------------ #
# Integration contract stub                                            #
# ------------------------------------------------------------------ #
async def _call_verification_engine(candidate: CandidateDetails) -> dict:
    """
    STUB: Call Parthiban's verification engine.

    THIS FUNCTION MUST BE REPLACED with a real call to the database
    verification layer once Parthiban's interface is available.

    Expected interface from Parthiban:
        Input:  CandidateDetails fields
        Output: dict with keys:
                  status, candidate_name, university_name, institute_name,
                  course, branch, register_number, year_of_passing,
                  backlog_status, period_of_study, mode_of_education

    BLOCKER: Awaiting Parthiban's database/verification engine implementation.

    Do NOT create a fake 'verified=True' response here.
    The stub raises NotImplementedError so integration gaps are visible.
    """
    raise NotImplementedError(
        "Verification engine not yet integrated. "
        "Awaiting Parthiban's database/verification engine implementation. "
        "See docs/db_contract.md for the required interface."
    )


# ------------------------------------------------------------------ #
# Public service functions                                            #
# ------------------------------------------------------------------ #
async def bind_candidate(
    request: BindCandidateRequest,
    session_company: str,
    session_email: str,
) -> BindCandidateResponse:
    """
    Bind a candidate to a PAID_UNUSED verification request.

    Validates:
      1. The verification_request_id exists and is owned by the
         current session (company/email match).
      2. The request is in PAID_UNUSED state.

    On success:
      - Transitions request to CANDIDATE_BOUND.
      - Returns candidate details for HR to review on confirmation screen.

    Raises:
        ValueError: On state conflict, ownership mismatch, or not found.
    """
    payment_session = get_session_by_request_id(request.verification_request_id)

    if not payment_session:
        raise ValueError("Verification request not found.")

    # Ownership check: session email must match payment session email
    if payment_session.hr_email.lower() != session_email.lower():
        logger.warning(
            "Unauthorized bind attempt: session_email=%s, owner_email=%s",
            session_email,
            payment_session.hr_email,
        )
        raise PermissionError("You are not authorized to access this verification request.")

    if payment_session.status != RequestStatus.PAID_UNUSED:
        raise ValueError(
            f"This verification request is in state '{payment_session.status}' "
            "and cannot accept a new candidate. "
            "A new payment is required to verify another candidate."
        )

    # Create verification request record
    vr_id = request.verification_request_id
    vr = _VerificationRequest(
        verification_request_id=vr_id,
        display_request_id=payment_session.display_request_id,
        company_name=payment_session.company_name,
        hr_email=payment_session.hr_email,
        status=RequestStatus.CANDIDATE_BOUND,
        candidate=request.candidate,
    )
    _verification_store[vr_id] = vr

    # Update payment session status
    payment_session.status = RequestStatus.CANDIDATE_BOUND

    logger.info(
        "Candidate bound to request %s (%s) for %s",
        payment_session.display_request_id,
        vr_id,
        payment_session.hr_email,
    )

    return BindCandidateResponse(
        verification_request_id=vr_id,
        display_request_id=payment_session.display_request_id,
        status=RequestStatus.CANDIDATE_BOUND,
        candidate=request.candidate,
    )


async def confirm_and_verify(
    request: ConfirmVerificationRequest,
    session_email: str,
) -> VerificationResultResponse:
    """
    HR confirms candidate details and triggers verification.

    Validates:
      1. Verification request exists and is CANDIDATE_BOUND.
      2. Owned by the current session.

    On confirmation:
      - Transitions to VERIFICATION_IN_PROGRESS.
      - Calls Parthiban's verification engine.
      - Transitions to VERIFIED or NOT_VERIFIED.
      - In all cases, the payment is consumed (status → COMPLETED).

    HARD RULE: Even if verification fails, the payment is consumed.
    A second candidate requires a new payment.

    Raises:
        ValueError: On state conflict or not found.
        NotImplementedError: Verification engine not yet integrated.
    """
    vr = _verification_store.get(request.verification_request_id)

    if not vr:
        raise ValueError("Verification request not found.")

    if vr.hr_email.lower() != session_email.lower():
        raise PermissionError("You are not authorized to access this verification request.")

    if vr.status != RequestStatus.CANDIDATE_BOUND:
        raise ValueError(
            f"Verification request is in state '{vr.status}'. "
            "Expected CANDIDATE_BOUND. Cannot re-verify."
        )

    # Transition to IN_PROGRESS
    vr.status = RequestStatus.VERIFICATION_IN_PROGRESS
    payment_session = get_session_by_request_id(request.verification_request_id)
    if payment_session:
        payment_session.status = RequestStatus.VERIFICATION_IN_PROGRESS

    # Call Parthiban's verification engine
    try:
        engine_result = await _call_verification_engine(vr.candidate)
    except NotImplementedError as exc:
        # Reset status so the request is not stuck – but payment is still consumed
        vr.status = RequestStatus.NOT_VERIFIED
        if payment_session:
            payment_session.status = RequestStatus.COMPLETED
        raise  # Re-raise so the route layer can return 503

    # Update final status
    final_status = engine_result.get("status", RequestStatus.NOT_VERIFIED)
    vr.status = final_status
    if payment_session:
        payment_session.status = RequestStatus.COMPLETED

    if final_status == RequestStatus.VERIFIED:
        return VerificationResultResponse(
            verification_request_id=vr.verification_request_id,
            display_request_id=vr.display_request_id,
            status=RequestStatus.VERIFIED,
            candidate_name=engine_result.get("candidate_name"),
            university_name=engine_result.get("university_name"),
            institute_name=engine_result.get("institute_name"),
            course=engine_result.get("course"),
            branch=engine_result.get("branch"),
            register_number=engine_result.get("register_number"),
            year_of_passing=engine_result.get("year_of_passing"),
            backlog_status=engine_result.get("backlog_status"),
            period_of_study=engine_result.get("period_of_study"),
            mode_of_education=engine_result.get("mode_of_education"),
            message="Verification successful. The official report has been sent to your verified email address.",
            verification_reference_url=(
                f"{settings.VERIFICATION_BASE_URL}/verify/{vr.verification_request_id}"
                if hasattr(settings, 'VERIFICATION_BASE_URL') else None
            ),
        )
    else:
        # NOT_VERIFIED – neutral message, no DB values leaked
        return VerificationResultResponse(
            verification_request_id=vr.verification_request_id,
            display_request_id=vr.display_request_id,
            status=RequestStatus.NOT_VERIFIED,
            message=(
                "The submitted candidate details could not be verified "
                "against the official institutional records."
            ),
        )


async def get_verification_status(
    verification_request_id: str,
    session_email: str,
) -> VerificationStatusResponse:
    """
    Get the current status of a verification request.

    Authorization: Only the owning HR session may query this.
    """
    vr = _verification_store.get(verification_request_id)
    if not vr:
        # Also check payment store for requests not yet bound
        payment_session = get_session_by_request_id(verification_request_id)
        if not payment_session:
            raise ValueError("Verification request not found.")
        if payment_session.hr_email.lower() != session_email.lower():
            raise PermissionError("You are not authorized to access this verification request.")
        return VerificationStatusResponse(
            verification_request_id=verification_request_id,
            display_request_id=payment_session.display_request_id or "",
            status=payment_session.status,
            company_name=payment_session.company_name,
            hr_email=payment_session.hr_email,
        )

    if vr.hr_email.lower() != session_email.lower():
        raise PermissionError("You are not authorized to access this verification request.")

    return VerificationStatusResponse(
        verification_request_id=vr.verification_request_id,
        display_request_id=vr.display_request_id,
        status=vr.status,
        company_name=vr.company_name,
        hr_email=vr.hr_email,
    )
