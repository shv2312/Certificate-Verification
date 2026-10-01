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

from difflib import SequenceMatcher
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.config import get_settings
from app.db.models import VerificationRequest, PaymentSession, Student
from app.schemas.verification import (
    InitiateVerificationRequest,
    InitiateVerificationResponse,
    BindCandidateRequest,
    BindCandidateResponse,
    CandidateDetails,
    ConfirmVerificationRequest,
    VerificationResultResponse,
    VerificationStatusResponse,
    PublicVerificationStatusResponse,
)
from app.services.payment_service import RequestStatus, get_session_by_request_id

logger = logging.getLogger(__name__)
settings = get_settings()


async def initiate_verification(
    db: AsyncSession,
    request: InitiateVerificationRequest,
    session: dict,
) -> InitiateVerificationResponse:
    """
    Initiate verification order:
    1. Generates payment session and gateway order
    2. Persists verification request in PAYMENT_PENDING state with candidate details
    3. Returns verification request ID and payment order details
    """
    from app.services import payment_service
    import time
    import secrets

    company_name = session["company_name"]
    hr_email = session["hr_email"]
    hr_name = session.get("hr_name", "")
    hr_phone = session.get("hr_phone", "")

    # Create payment session
    payment_res = await payment_service.initiate_payment(
        db=db,
        company_name=company_name,
        hr_email=hr_email,
        hr_name=hr_name,
        hr_phone=hr_phone,
    )

    verification_req_id = secrets.token_urlsafe(32)
    display_id = await payment_service._generate_display_request_id(db)

    # Serialize candidate payload
    candidate_dict = request.model_dump()
    candidate_json = json.dumps(candidate_dict)

    degree_val = request.degree or request.degree_course or "B.E."
    vr = VerificationRequest(
        id=verification_req_id,
        display_request_id=display_id,
        payment_session_id=payment_res.payment_session_id,
        status="PAYMENT_PENDING",
        company_name=company_name,
        hr_email=hr_email,
        hr_name=hr_name,
        hr_phone=hr_phone,
        hr_submitted_name=request.candidate_name.strip(),
        hr_submitted_register_number=request.register_number.strip().upper(),
        hr_submitted_programme=degree_val.strip(),
        hr_submitted_branch=request.specialization.strip() if request.specialization else "General",
        hr_submitted_year_of_passing=request.year_of_passing or 2024,
        candidate_data=candidate_json,
        certificate_url=request.certificate_url,
        created_at=int(time.time()),
    )
    db.add(vr)

    payment_session = await db.get(PaymentSession, payment_res.payment_session_id)
    if payment_session:
        payment_session.verification_request_id = verification_req_id

    await db.flush()

    return InitiateVerificationResponse(
        verification_request_id=verification_req_id,
        display_request_id=display_id,
        payment_order_id=payment_res.gateway_order_id,
        payment_session_id=payment_res.payment_session_id,
        gateway_key_id=payment_res.gateway_key_id,
        amount_paise=payment_res.amount_paise,
        currency="INR",
        candidate_summary={
            "candidate_name": request.candidate_name.strip(),
            "register_number": request.register_number.strip().upper(),
            "degree_course": degree_val.strip(),
            "entry_mode": request.admission_type or request.entry_mode or "Regular Entry (1st Year)",
            "year_of_passing": request.year_of_passing or 2024,
        },
    )


# ------------------------------------------------------------------ #
# Internal helpers                                                     #
# ------------------------------------------------------------------ #
async def _call_verification_engine(db: AsyncSession, candidate: CandidateDetails) -> dict:
    """
    Call the verification engine interface.

    This function calls the verification engine defined in app/engine/verification.py.
    """
    from app.engine.verification import verify_candidate
    
    result = await verify_candidate(
        db=db,
        candidate_name=candidate.candidate_name,
        register_number=candidate.register_number,
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
    if vr.status not in (
        RequestStatus.PAID_UNUSED,
        RequestStatus.CANDIDATE_BOUND,
        "PAID_UNUSED",
        "CANDIDATE_BOUND",
    ):
        raise ValueError(
            f"Verification request is in state '{vr.status}'. "
            "Expected PAID_UNUSED or CANDIDATE_BOUND. Cannot re-verify."
        )

    # Bind candidate fields if passed in request or found in candidate_data
    if request.candidate_name:
        vr.hr_submitted_name = request.candidate_name.strip()
    if request.register_number:
        vr.hr_submitted_register_number = request.register_number.strip().upper()
    if request.programme or request.degree:
        vr.hr_submitted_programme = (request.programme or request.degree).strip()
    if request.branch or request.specialization:
        vr.hr_submitted_branch = (request.branch or request.specialization).strip()
    if request.year_of_passing:
        vr.hr_submitted_year_of_passing = int(request.year_of_passing)

    if vr.candidate_data:
        try:
            cdata = json.loads(vr.candidate_data)
            if not vr.hr_submitted_name and cdata.get("candidate_name"):
                vr.hr_submitted_name = cdata["candidate_name"].strip()
            if not vr.hr_submitted_register_number and cdata.get("register_number"):
                vr.hr_submitted_register_number = cdata["register_number"].strip().upper()
            if not vr.hr_submitted_programme and (cdata.get("degree") or cdata.get("degree_course")):
                vr.hr_submitted_programme = (cdata.get("degree") or cdata.get("degree_course")).strip()
            if not vr.hr_submitted_branch and cdata.get("specialization"):
                vr.hr_submitted_branch = cdata["specialization"].strip()
            if not vr.hr_submitted_year_of_passing and cdata.get("year_of_passing"):
                vr.hr_submitted_year_of_passing = int(cdata["year_of_passing"])
        except Exception:
            pass

    stmt_pay = select(PaymentSession).where(PaymentSession.verification_request_id == request.verification_request_id)
    result = await db.execute(stmt_pay)
    payment_session = result.scalar_one_or_none()

    # Calculate fuzzy match score against official records in SQLite (dev_local.db)
    reg_num = (vr.hr_submitted_register_number or "").strip().upper()
    submitted_name = (vr.hr_submitted_name or "").strip()
    submitted_prog = vr.hr_submitted_programme or ""
    submitted_branch = vr.hr_submitted_branch or ""
    submitted_year = vr.hr_submitted_year_of_passing

    stmt_stu = select(Student).where(func.upper(Student.register_number) == reg_num)
    res_stu = await db.execute(stmt_stu)
    student = res_stu.scalar_one_or_none()

    if student:
        name_ratio = SequenceMatcher(None, submitted_name.lower(), student.full_name.lower()).ratio()
        year_match = 1.0 if (submitted_year and student.year_of_passing == submitted_year) else 0.0
        match_score = round((name_ratio * 0.75 + year_match * 0.25) * 100, 2)
        mismatch_probability = round(max(0.0, 100.0 - match_score), 2)
        comparison_data = {
            "record_found": True,
            "matched_student_id": student.id,
            "official_register_number": student.register_number,
            "official_name": student.full_name,
            "official_year_of_passing": student.year_of_passing,
            "official_institute": student.institute_name,
            "official_university": student.university_name,
            "submitted_name": submitted_name,
            "submitted_register_number": reg_num,
            "submitted_year_of_passing": submitted_year,
            "submitted_programme": submitted_prog,
            "submitted_branch": submitted_branch,
            "name_similarity_ratio": round(name_ratio, 4),
            "year_match": bool(year_match),
        }
    else:
        match_score = 0.0
        mismatch_probability = 100.0
        comparison_data = {
            "record_found": False,
            "submitted_register_number": reg_num,
            "submitted_name": submitted_name,
            "submitted_year_of_passing": submitted_year,
            "submitted_programme": submitted_prog,
            "submitted_branch": submitted_branch,
        }

    verification_payload = {
        "status": "PENDING_ADMIN_REVIEW",
        "match_score": match_score,
        "mismatch_probability": mismatch_probability,
        "comparison_data": comparison_data,
    }

    vr.status = "PENDING_ADMIN_REVIEW"
    vr.admin_decision = "PENDING_REVIEW"
    vr.verification_result = json.dumps(verification_payload)
    if payment_session:
        payment_session.status = RequestStatus.COMPLETED

    await db.flush()

    return VerificationResultResponse(
        verification_request_id=vr.id,
        display_request_id=vr.display_request_id,
        status="PENDING_ADMIN_REVIEW",
        current_state="PENDING_ADMIN_REVIEW",
        request_id=vr.display_request_id,
        candidate_name=submitted_name,
        register_number=reg_num,
        course=submitted_prog,
        branch=submitted_branch,
        year_of_passing=submitted_year,
        match_score=match_score,
        mismatch_probability=mismatch_probability,
        comparison_data=comparison_data,
        message="Verification request submitted for official institutional review.",
        verification_reference_url=(
            f"{settings.VERIFICATION_BASE_URL}/verify/{vr.id}"
            if hasattr(settings, "VERIFICATION_BASE_URL") else None
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


async def get_verification_history(
    db: AsyncSession,
    session_email: str,
) -> list[VerificationStatusResponse]:
    """
    Get all verification requests owned by the authenticated HR user.
    """
    stmt = select(VerificationRequest).where(
        func.lower(VerificationRequest.hr_email) == session_email.lower()
    ).order_by(VerificationRequest.created_at.desc())
    
    result = await db.execute(stmt)
    requests = result.scalars().all()
    
    return [
        VerificationStatusResponse(
            verification_request_id=vr.id,
            display_request_id=vr.display_request_id,
            status=vr.status,
            company_name=vr.company_name,
            hr_email=vr.hr_email,
        ) for vr in requests
    ]


async def get_verification_report(
    db: AsyncSession,
    verification_request_id: str,
    session_email: str,
) -> VerificationResultResponse:
    """
    Get the detailed verification report for a completed request.
    """
    vr = await db.get(VerificationRequest, verification_request_id)
    if not vr:
        raise ValueError("Verification request not found.")

    if vr.hr_email.lower() != session_email.lower():
        raise PermissionError("You are not authorized to access this verification request.")

    if vr.status not in (RequestStatus.VERIFIED, RequestStatus.NAME_MISMATCH, RequestStatus.NOT_FOUND, RequestStatus.ERROR):
        raise ValueError("Verification report is not available for this request state.")
        
    engine_result = {}
    if vr.verification_result:
        try:
            engine_result = json.loads(vr.verification_result)
        except json.JSONDecodeError:
            pass

    if vr.status == RequestStatus.VERIFIED:
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
        message = "The submitted candidate details could not be verified against the official institutional records."
        if vr.status == RequestStatus.NOT_FOUND:
             message = "No official record was found for the submitted register number."
        elif vr.status == RequestStatus.NAME_MISMATCH:
             message = "The submitted candidate name does not match the official record."
        elif vr.status == RequestStatus.ERROR:
             message = "Service is temporarily unavailable. Please try again later or contact support."

        return VerificationResultResponse(
            verification_request_id=vr.id,
            display_request_id=vr.display_request_id,
            status=vr.status,
            message=message,
        )


# ------------------------------------------------------------------ #
# Public status (no auth, masked PII)                                 #
# ------------------------------------------------------------------ #
_STATUS_LABELS: dict[str, str] = {
    "PAID_UNUSED":               "Payment Received — Pending Submission",
    "CANDIDATE_BOUND":           "Details Submitted — Awaiting Confirmation",
    "VERIFICATION_IN_PROGRESS":  "Verification In Progress",
    "VERIFIED":                  "Verified ✔",
    "NOT_VERIFIED":              "Could Not Be Verified",
    "NAME_MISMATCH":             "Could Not Be Verified",
    "NOT_FOUND":                 "Could Not Be Verified",
    "ERROR":                     "Processing Error",
}


def _mask_name(full_name: Optional[str]) -> Optional[str]:
    """
    Mask a candidate name for public display.
    Each word is reduced to its first letter followed by '***'.
    Example: 'Arjun Ramaswamy' -> 'A*** R***'
    """
    if not full_name:
        return None
    words = full_name.strip().split()
    return " ".join(w[0].upper() + "***" for w in words if w)


async def get_public_verification_status(
    db: AsyncSession,
    request_id: str,
) -> PublicVerificationStatusResponse:
    """
    Return masked verification status for public (unauthenticated) lookup.

    Accepts both:
      - Internal UUID (vr.id)              e.g. "a3f9..."
      - Human-readable display ID (vr.display_request_id)  e.g. "SIET-2024-0001"

    PII guarantees:
      - Raw UUID primary key is NEVER included in the response.
      - Candidate name is masked: first letter of each word + '***'.
      - HR email is OMITTED entirely.
      - No SQL error details are leaked (generic 404 on not found).
    """
    from sqlalchemy import or_
    from fastapi import HTTPException, status as http_status

    stmt = select(VerificationRequest).where(
        or_(
            VerificationRequest.id == request_id,
            VerificationRequest.display_request_id == request_id,
        )
    )
    result = await db.execute(stmt)
    vr = result.scalar_one_or_none()

    if not vr:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "Verification request not found. Please check the Request ID and try again.",
                "error_code": "REQUEST_NOT_FOUND",
            },
        )

    # Extract candidate name from stored JSON if available
    candidate_name_raw: Optional[str] = None
    if vr.candidate_data:
        try:
            cd = json.loads(vr.candidate_data)
            candidate_name_raw = cd.get("candidate_name")
        except (json.JSONDecodeError, TypeError):
            pass

    # If verification result has a name (from engine), prefer it
    if vr.verification_result:
        try:
            vr_data = json.loads(vr.verification_result)
            engine_name = vr_data.get("candidate_name")
            if engine_name:
                candidate_name_raw = engine_name
        except (json.JSONDecodeError, TypeError):
            pass

    status_label = _STATUS_LABELS.get(vr.status, vr.status.replace("_", " ").title())

    return PublicVerificationStatusResponse(
        display_request_id=vr.display_request_id,
        status=vr.status,
        status_label=status_label,
        company_name=vr.company_name,
        candidate_name_masked=_mask_name(candidate_name_raw),
        verification_reference_url=(
            f"{settings.VERIFICATION_BASE_URL}/status/{vr.display_request_id}"
            if vr.status == "VERIFIED" else None
        ),
    )
