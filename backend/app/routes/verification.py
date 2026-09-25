"""
app/routes/verification.py
===========================
Routes for the candidate verification flow.

Endpoints:
    POST /api/v1/verification/bind-candidate
        → Bind candidate details to a PAID_UNUSED request

    POST /api/v1/verification/confirm
        → HR confirms details; triggers the verification engine

    GET  /api/v1/verification/{request_id}/status
        → Get current status (auth-protected, HR-only)

    GET  /api/v1/verification/public-status/{request_id}
        → Public status lookup — masked PII, no auth required

All endpoints except public-status require a valid session token.

AUTHORIZATION:
    Every endpoint verifies that the requesting session owns the
    verification_request_id in question.  Attempting to access
    another HR's request by guessing an ID is blocked.

ONE-PAYMENT-ONE-CANDIDATE:
    Enforced by the verification_service via state machine checks.
    The database must additionally enforce this via atomic transactions
    and unique constraints (Parthiban's responsibility).
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import verify_session_token, require_role
from app.schemas.common import APIResponse
from app.schemas.verification import (
    BindCandidateRequest,
    BindCandidateResponse,
    ConfirmVerificationRequest,
    VerificationResultResponse,
    VerificationStatusResponse,
    VerificationHistoryResponse,
    PublicVerificationStatusResponse,
)
from app.services import verification_service
from app.services.email_service import send_verification_report_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/verification", tags=["Verification"])


@router.post(
    "/bind-candidate",
    response_model=APIResponse[BindCandidateResponse],
    summary="Bind candidate to a paid verification request",
    description=(
        "Binds the submitted candidate details to a PAID_UNUSED verification request. "
        "The HR is then shown a confirmation screen before the final verify step. "
        "Requires email verification and a successful payment."
    ),
)
async def bind_candidate(
    body: BindCandidateRequest,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[BindCandidateResponse]:
    """
    Requires: Authorization: Bearer <session_token>

    Transitions request: PAID_UNUSED → CANDIDATE_BOUND

    The response includes a warning reminding HR that this payment
    can only be used for one candidate.
    """
    data = await verification_service.bind_candidate(
        db=db,
        request=body,
        session_company=session["company_name"],
        session_email=session["hr_email"],
    )
    return APIResponse(
        success=True,
        message="Candidate details accepted. Please review and confirm to proceed.",
        data=data,
    )


@router.post(
    "/confirm",
    response_model=APIResponse[VerificationResultResponse],
    summary="Confirm candidate details and trigger verification",
    description=(
        "HR confirms the candidate details. This irreversibly consumes the payment "
        "and triggers the verification engine against institutional records. "
        "Even if verification fails, the payment cannot be reused."
    ),
)
async def confirm_verification(
    body: ConfirmVerificationRequest,
    background_tasks: BackgroundTasks,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[VerificationResultResponse]:
    """
    Requires: Authorization: Bearer <session_token>

    Transitions request: CANDIDATE_BOUND → VERIFICATION_IN_PROGRESS → VERIFIED | NOT_VERIFIED

    On VERIFIED:
        Returns authorized academic information from institutional records.
        Report also sent to the verified HR email.

    On NOT_VERIFIED:
        Returns a neutral failure message.
        No institutional data is leaked.

    BLOCKER (Sprint 1): Verification engine not yet integrated.
    Returns 503 until Parthiban's engine is available.
    """
    data = await verification_service.confirm_and_verify(
        db=db,
        request=body,
        session_email=session["hr_email"],
    )

    if data.status == "VERIFIED":
        message = "Verification successful. The official report has been sent to your verified email."
    else:
        message = (
            "The submitted candidate details could not be verified "
            "against the official institutional records."
        )

    # Enqueue report email as a background task so the response
    # is returned immediately to the frontend regardless of SMTP latency.
    background_tasks.add_task(
        send_verification_report_email,
        hr_email=session["hr_email"],
        company_name=session["company_name"],
        report=data.model_dump(),
    )

    return APIResponse(
        success=True,
        message=message,
        data=data,
    )


@router.get(
    "/{request_id}/status",
    response_model=APIResponse[VerificationStatusResponse],
    summary="Get verification request status",
    description=(
        "Returns the current status of a verification request. "
        "Only accessible by the HR session that created the request."
    ),
)
async def get_verification_status(
    request_id: str,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[VerificationStatusResponse]:
    """
    Requires: Authorization: Bearer <session_token>

    AUTHORIZATION: Returns 403 if the session does not own this request.
    """
    data = await verification_service.get_verification_status(
        db=db,
        verification_request_id=request_id,
        session_email=session["hr_email"],
    )
    return APIResponse(
        success=True,
        message=f"Request status: {data.status}",
        data=data,
    )


@router.get(
    "/history",
    response_model=APIResponse[VerificationHistoryResponse],
    summary="Get verification request history",
    description="Returns a list of all verification requests owned by the authenticated HR session.",
)
async def get_verification_history_route(
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[VerificationHistoryResponse]:
    """
    Requires: Authorization: Bearer <session_token>
    """
    requests = await verification_service.get_verification_history(
        db=db,
        session_email=session["hr_email"],
    )
    return APIResponse(
        success=True,
        message="History retrieved successfully",
        data=VerificationHistoryResponse(requests=requests),
    )


@router.get(
    "/{request_id}/report",
    response_model=APIResponse[VerificationResultResponse],
    summary="Get verification report",
    description="Fetch the detailed verification result (academic data) for a completed request.",
)
async def get_verification_report_route(
    request_id: str,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[VerificationResultResponse]:
    """
    Requires: Authorization: Bearer <session_token>
    """
    data = await verification_service.get_verification_report(
        db=db,
        verification_request_id=request_id,
        session_email=session["hr_email"],
    )
    return APIResponse(
        success=True,
        message=data.message,
        data=data,
    )


@router.get(
    "/public-status/{request_id}",
    response_model=APIResponse[PublicVerificationStatusResponse],
    summary="[Public] Get masked verification status",
    description=(
        "Returns the current status of a verification request with all PII masked. "
        "No authentication required. Safe to call from any client. "
        "Does NOT expose HR email, candidate full name, or any database primary keys."
    ),
)
async def get_public_verification_status(
    request_id: str,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[PublicVerificationStatusResponse]:
    """
    PUBLIC endpoint — no Bearer token required.

    PII masking rules applied:
        candidate_name: first letter + '***' (e.g., 'Arjun' → 'A***')
        company_name:   returned as-is (company name is not PII)
        hr_email:       NOT included in response
        request ID:     only display_request_id is returned, never the raw UUID
    """
    data = await verification_service.get_public_verification_status(
        db=db,
        request_id=request_id,
    )
    return APIResponse(
        success=True,
        message=f"Verification status: {data.status}",
        data=data,
    )


@router.get(
    "/{request_id}/download-pdf",
    summary="Download official verification PDF report",
    description="Returns the generated binary directly as a downloadable application/pdf stream.",
)
async def download_verification_pdf(
    request_id: str,
    db: AsyncSession = Depends(get_db)
):
    from fastapi.responses import StreamingResponse
    from fastapi import HTTPException
    import json
    from app.db.models import VerificationRequest
    from app.services.pdf_service import generate_verification_pdf
    
    vr = await db.get(VerificationRequest, request_id)
    if not vr:
        raise HTTPException(status_code=404, detail="Verification request not found")
        
    if vr.status != "VERIFIED":
        raise HTTPException(status_code=400, detail="PDF report is only available for VERIFIED requests.")
        
    engine_result = {}
    if vr.verification_result:
        try:
            engine_result = json.loads(vr.verification_result)
        except Exception:
            pass
            
    # Assemble record_data
    record_data = {
        "verification_request_id": vr.id,
        "display_request_id": vr.display_request_id,
        "company_name": vr.company_name,
        "hr_email": vr.hr_email,
        "status": vr.status,
        "candidate_name": engine_result.get("candidate_name") or vr.hr_submitted_name,
        "register_number": engine_result.get("register_number") or vr.hr_submitted_register_number,
        "course": engine_result.get("course") or vr.hr_submitted_programme,
        "branch": engine_result.get("branch") or vr.hr_submitted_branch,
        "year_of_passing": engine_result.get("year_of_passing") or vr.hr_submitted_year_of_passing,
        "period_of_study": engine_result.get("period_of_study", "N/A"),
        "backlog_status": engine_result.get("backlog_status", "N/A"),
    }
    
    pdf_buffer = generate_verification_pdf(record_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="SIET_Verification_{vr.display_request_id}.pdf"'
        }
    )

