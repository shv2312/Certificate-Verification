"""
app/routes/email_verification.py
==================================
Routes for HR email OTP verification.

Endpoints:
    POST /api/v1/email/send-otp     → Send OTP to HR email
    POST /api/v1/email/verify-otp   → Verify OTP, receive session token

These endpoints do NOT require authentication (they are the first step
in establishing a verified session).

Rate limiting:
    Sprint 1: Basic cooldown is enforced in email_service (per-email).
    Sprint 2+: Add IP-level rate limiting middleware.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.common import APIResponse
from app.schemas.email_verification import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
)
from app.services import email_service

router = APIRouter(prefix="/api/v1/email", tags=["Email Verification"])


@router.post(
    "/send-otp",
    response_model=APIResponse[SendOTPResponse],
    summary="Send email verification OTP",
    description=(
        "Validates company details and sends a 6-digit OTP to the provided "
        "HR email address. The OTP expires in OTP_EXPIRY_MINUTES minutes."
    ),
    status_code=200,
)
async def send_otp(body: SendOTPRequest, db: AsyncSession = Depends(get_db)) -> APIResponse[SendOTPResponse]:
    """
    Step 1 of the email verification flow.

    Input:
        company_name, hr_email

    Output:
        masked_email, resend_allowed_after_seconds
        [DEV ONLY] dev_otp (None in production)

    Raises:
        409 – If resend cooldown is still active.
        422 – If request body fails validation.
    """
    response_data = await email_service.create_and_send_otp(
        db=db,
        company_name=body.company_name,
        hr_email=str(body.hr_email),
    )
    return APIResponse(
        success=True,
        message=f"Verification code sent to {response_data.masked_email}. "
                f"Please check your email.",
        data=response_data,
    )


@router.post(
    "/verify-otp",
    response_model=APIResponse[VerifyOTPResponse],
    summary="Verify email OTP",
    description=(
        "Verifies the OTP entered by the HR. On success, returns a session token "
        "required for all subsequent payment and verification endpoints."
    ),
    status_code=200,
)
async def verify_otp(body: VerifyOTPRequest, db: AsyncSession = Depends(get_db)) -> APIResponse[VerifyOTPResponse]:
    """
    Step 2 of the email verification flow.

    Input:
        challenge_id (from send-otp response), otp (6 digits)

    Output:
        session_token, verified_company, verified_email

    The session_token must be included as:
        Authorization: Bearer <session_token>
    on all subsequent payment and verification requests.

    Raises:
        409 – If OTP expired, max attempts exceeded, or already verified.
        422 – If request body fails validation.
    """
    response_data = await email_service.verify_otp(
        db=db,
        challenge_id=body.challenge_id,
        submitted_otp=body.otp,
    )
    return APIResponse(
        success=True,
        message=(
            f"Email verified successfully for {response_data.verified_company}. "
            "You may now proceed to payment."
        ),
        data=response_data,
    )
