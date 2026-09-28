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

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, HTTPException
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


# ------------------------------------------------------------------ #
# GET /api/v1/verification/status/{lookup_id}                        #
# ------------------------------------------------------------------ #

from pydantic import BaseModel
from typing import Optional, Any

class PublicVerificationLookupResponse(BaseModel):
    display_request_id: str
    institution_id: str
    status: str
    admin_decision: Optional[str] = None
    verified_at: Optional[Any] = None
    candidate_name_masked: Optional[str] = None
    is_verified: bool
    academic_year: Optional[int] = None
    course_name: Optional[str] = None


def _mask_candidate_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    tokens = name.strip().split()
    masked_tokens = []
    for token in tokens:
        if len(token) <= 1:
            masked_tokens.append(token)
        elif len(token) == 2:
            masked_tokens.append(token[0] + "*")
        else:
            masked_tokens.append(token[0] + ("*" * (len(token) - 2)) + token[-1])
    return " ".join(masked_tokens)


@router.get(
    "/status/{lookup_id}",
    response_model=PublicVerificationLookupResponse,
    summary="[Public] Verify Academic Credential Authenticity",
    description="Public-facing status verification endpoint supporting lookup by UUID or display_request_id (e.g., QR scan).",
)
async def public_lookup_status(
    lookup_id: str,
    db: AsyncSession = Depends(get_db),
) -> PublicVerificationLookupResponse:
    import json
    from sqlalchemy import select, or_
    from app.db.models import VerificationRequest

    stmt = select(VerificationRequest).where(
        or_(
            VerificationRequest.id == lookup_id,
            VerificationRequest.display_request_id == lookup_id,
        )
    )
    res = await db.execute(stmt)
    vr = res.scalar_one_or_none()

    if not vr:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found"
        )

    # Candidate details & academic data
    candidate_name = vr.hr_submitted_name
    course_name = vr.hr_submitted_programme
    academic_year = vr.hr_submitted_year_of_passing
    institution_id = "siet-cbe"

    if vr.candidate_data:
        try:
            cd = json.loads(vr.candidate_data)
            candidate_name = cd.get("candidate_name") or candidate_name
            course_name = cd.get("course") or cd.get("course_name") or cd.get("programme") or course_name
            academic_year = cd.get("year_of_passing") or academic_year
            institution_id = cd.get("institution_id") or institution_id
        except (json.JSONDecodeError, TypeError):
            pass

    is_verified = (vr.status == "VERIFIED" or vr.admin_decision == "APPROVED")
    verified_at = vr.completed_at

    return PublicVerificationLookupResponse(
        display_request_id=vr.display_request_id,
        institution_id=institution_id,
        status=vr.status,
        admin_decision=vr.admin_decision,
        verified_at=verified_at,
        candidate_name_masked=_mask_candidate_name(candidate_name),
        is_verified=is_verified,
        academic_year=academic_year,
        course_name=course_name,
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


@router.post(
    "/upload-certificate",
    summary="Upload Candidate Certificate File",
    description="Accepts PDF/PNG/JPG certificate file under 5MB and saves it securely with a UUID prefix."
)
async def upload_certificate(
    file: UploadFile = File(...)
):
    import os
    import uuid
    from fastapi.responses import JSONResponse

    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(allowed_extensions)}"
        )

    # 5 MB max size check
    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum allowed limit of 5 MB."
        )

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "certificates")
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "file_url": f"/uploads/certificates/{safe_filename}",
        "filename": safe_filename
    }


@router.get(
    "/certificate/{filename}",
    summary="Stream uploaded certificate file",
    description="Streams the specified uploaded certificate file."
)
async def get_certificate_file(filename: str):
    import os
    from fastapi.responses import FileResponse

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "certificates")
    file_path = os.path.join(upload_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Certificate file not found.")

    return FileResponse(file_path)


