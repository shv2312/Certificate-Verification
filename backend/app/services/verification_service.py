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

import json
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.config import get_settings
from app.db.models import VerificationRequest, PaymentSession
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
# Internal helpers                                                     #
# ------------------------------------------------------------------ #
async def _call_verification_engine(candidate: CandidateDetails) -> dict:
    """
    Call the verification engine interface.

    This function calls the verification engine defined in app/engine/verification.py.
    """
    from app.engine.verification import verify_candidate
    
    result = await verify_candidate(
        candidate_name=candidate.candidate_name,
        register_number=candidate.register_number,
        course=candidate.course,
        branch=candidate.branch,
        year_of_passing=candidate.year_of_passing
    )
    
    return {
        "status": result.status,
        "candidate_name": result.candidate_name,
        "university_name": result.university_name,
        "institute_name": result.institute_name,
        "course": result.course,
        "branch": result.branch,
        "register_number": result.register_number,
        "year_of_passing": result.year_of_passing,
        "backlog_status": result.backlog_status,
        "period_of_study": result.period_of_study,
        "mode_of_education": result.mode_of_education
    }


# ------------------------------------------------------------------ #
# Public service functions                                            #
# ------------------------------------------------------------------ #
async def bind_candidate(
    db: AsyncSession,
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
    vr = await db.get(VerificationRequest, request.verification_request_id)

    if not vr:
        raise ValueError("Verification request not found.")

    # Ownership check: session email must match payment session email
    if vr.hr_email.lower() != session_email.lower():
        logger.warning(
            "Unauthorized bind attempt: session_email=%s, owner_email=%s",
            session_email,
            vr.hr_email,
        )
        raise PermissionError("You are not authorized to access this verification request.")

    if vr.status != RequestStatus.PAID_UNUSED:
        raise ValueError(
            f"This verification request is in state '{vr.status}' "
            "and cannot accept a new candidate. "
            "A new payment is required to verify another candidate."
        )

    # Atomic Update for One-Payment-One-Candidate Enforcement
    stmt = (
        update(VerificationRequest)
        .where(
            VerificationRequest.id == request.verification_request_id,
            VerificationRequest.status == RequestStatus.PAID_UNUSED
        )
        .values(
            status=RequestStatus.CANDIDATE_BOUND,
            candidate_data=request.candidate.model_dump_json()
        )
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise ValueError("Concurrency error: The verification request was already consumed.")
        
    await db.flush()
    
    # Also update payment session status
    stmt_pay = (
        update(PaymentSession)
        .where(PaymentSession.verification_request_id == request.verification_request_id)
        .values(status=RequestStatus.CANDIDATE_BOUND)
    )
    await db.execute(stmt_pay)
    await db.flush()

    logger.info(
        "Candidate bound to request %s (%s) for %s",
        vr.display_request_id,
        request.verification_request_id,
        vr.hr_email,
    )

    return BindCandidateResponse(
        verification_request_id=request.verification_request_id,
        display_request_id=vr.display_request_id,
        status=RequestStatus.CANDIDATE_BOUND,
        candidate=request.candidate,
    )


async def confirm_and_verify(
    db: AsyncSession,
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
    vr = await db.get(VerificationRequest, request.verification_request_id)

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
    
    stmt_pay = select(PaymentSession).where(PaymentSession.verification_request_id == request.verification_request_id)
    result = await db.execute(stmt_pay)
    payment_session = result.scalar_one_or_none()
    
    if payment_session:
        payment_session.status = RequestStatus.VERIFICATION_IN_PROGRESS

    await db.flush()

    # Parse Candidate Details
    candidate_obj = None
    if vr.candidate_data:
        candidate_obj = CandidateDetails.model_validate_json(vr.candidate_data)

    # Call Parthiban's verification engine
    try:
        engine_result = await _call_verification_engine(candidate_obj)
    except NotImplementedError as exc:
        # Reset status so the request is not stuck – but payment is still consumed
        vr.status = RequestStatus.NOT_VERIFIED
        if payment_session:
            payment_session.status = RequestStatus.COMPLETED
        await db.flush()
        raise  # Re-raise so the route layer can return 503

    # Update final status
    final_status = engine_result.get("status", RequestStatus.NOT_VERIFIED)
    vr.status = final_status
    if payment_session:
        payment_session.status = RequestStatus.COMPLETED

    await db.flush()

    if final_status == RequestStatus.VERIFIED:
        return VerificationResultResponse(
            verification_request_id=vr.id,
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
                f"{settings.VERIFICATION_BASE_URL}/verify/{vr.id}"
                if hasattr(settings, 'VERIFICATION_BASE_URL') else None
            ),
        )
    else:
        # NOT_VERIFIED – neutral message, no DB values leaked
        return VerificationResultResponse(
            verification_request_id=vr.id,
            display_request_id=vr.display_request_id,
            status=RequestStatus.NOT_VERIFIED,
            message=(
                "The submitted candidate details could not be verified "
                "against the official institutional records."
            ),
        )


async def get_verification_status(
    db: AsyncSession,
    verification_request_id: str,
    session_email: str,
) -> VerificationStatusResponse:
    """
    Get the current status of a verification request.

    Authorization: Only the owning HR session may query this.
    """
    vr = await db.get(VerificationRequest, verification_request_id)
    if not vr:
        raise ValueError("Verification request not found.")

    if vr.hr_email.lower() != session_email.lower():
        raise PermissionError("You are not authorized to access this verification request.")

    return VerificationStatusResponse(
        verification_request_id=vr.id,
        display_request_id=vr.display_request_id,
        status=vr.status,
        company_name=vr.company_name,
        hr_email=vr.hr_email,
    )
