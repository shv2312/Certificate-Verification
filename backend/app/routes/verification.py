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
        → Get current status of a verification request

All endpoints require a valid session token.

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

from fastapi import APIRouter, Depends
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
)
from app.services import verification_service

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
