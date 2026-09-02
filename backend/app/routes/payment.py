"""
app/routes/payment.py
======================
Routes for the payment flow.

Endpoints:
    POST /api/v1/payment/initiate
        → Create a payment session and return gateway details
    POST /api/v1/payment/webhook
        → Receive payment confirmation from the payment provider
    GET  /api/v1/payment/{payment_session_id}/status
        → Poll payment status (frontend polling after redirect)
    POST /api/v1/payment/dev/confirm/{payment_session_id}
        → DEV ONLY: Simulate successful payment (disabled when DEV_MOCK_PAYMENT=false)

SECURITY:
    - /initiate requires a valid session token (email must be verified first)
    - /webhook does NOT require a session token (provider calls it directly)
      but MUST verify the provider signature
    - /status requires a valid session token
    - /dev/confirm is only active when DEV_MOCK_PAYMENT=true
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.session import get_db
from app.dependencies import verify_session_token, require_role
from app.schemas.common import APIResponse
from app.schemas.payment import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentStatusResponse,
    PaymentWebhookResponse,
)
from app.services import payment_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/payment", tags=["Payment"])


@router.post(
    "/initiate",
    response_model=APIResponse[PaymentInitiateResponse],
    summary="Initiate a payment session",
    description=(
        "Creates a payment session and returns gateway details needed by the frontend "
        "to open the payment widget.  Requires email verification."
    ),
)
async def initiate_payment(
    _body: PaymentInitiateRequest,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[PaymentInitiateResponse]:
    """
    Requires: Authorization: Bearer <session_token>

    Returns gateway details (order_id, public key_id, amount).
    The secret key is NEVER returned here.
    """
    data = await payment_service.initiate_payment(
        db=db,
        company_name=session["company_name"],
        hr_email=session["hr_email"],
    )
    return APIResponse(
        success=True,
        message="Payment session created. Please complete the payment.",
        data=data,
    )


@router.post(
    "/webhook",
    response_model=PaymentWebhookResponse,
    summary="Payment provider webhook",
    description=(
        "Receives payment event callbacks from the payment provider. "
        "This endpoint is NOT for frontend calls.  "
        "Payment provider signature is verified server-side."
    ),
    include_in_schema=True,  # Visible in docs for transparency; not for HR use
)
async def payment_webhook(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> PaymentWebhookResponse:
    """
    Called by the payment provider (not the frontend).

    Process:
      1. Read raw body (needed for signature verification)
      2. Extract signature header
      3. Verify signature with PAYMENT_GATEWAY_WEBHOOK_SECRET
      4. Update payment session to PAID_UNUSED on success

    Sprint 1: Stubbed – raises 503 in non-mock mode.
    """
    raw_body = await request.body()
    # Header name varies by provider; placeholder used here
    sig_header = request.headers.get("X-Payment-Signature", "")

    await payment_service.process_payment_webhook(
        raw_body=raw_body,
        signature_header=sig_header,
    )
    return PaymentWebhookResponse(acknowledged=True)


@router.get(
    "/{payment_session_id}/status",
    response_model=APIResponse[PaymentStatusResponse],
    summary="Get payment status",
    description="Poll the current status of a payment session.",
)
async def get_payment_status(
    payment_session_id: str,
    session: dict = Depends(require_role(["HR"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[PaymentStatusResponse]:
    """
    Requires: Authorization: Bearer <session_token>

    Returns current status: PENDING | PAID_UNUSED | FAILED | EXPIRED
    """
    data = await payment_service.get_payment_status(db, payment_session_id)
    return APIResponse(
        success=True,
        message=f"Payment status: {data.status}",
        data=data,
    )


# ------------------------------------------------------------------ #
# DEV-ONLY endpoint                                                   #
# ------------------------------------------------------------------ #
@router.post(
    "/dev/confirm/{payment_session_id}",
    response_model=APIResponse[PaymentStatusResponse],
    summary="[DEV ONLY] Simulate successful payment",
    description=(
        "**Development only.** Simulates a successful payment callback without "
        "involving a real payment gateway. "
        "This endpoint is DISABLED when DEV_MOCK_PAYMENT=false. "
        "MUST be removed or protected before production deployment."
    ),
    tags=["Development"],
)
async def dev_confirm_payment(
    payment_session_id: str,
    session: dict = Depends(require_role(["HR"])),
    settings: Settings = Depends(get_settings),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[PaymentStatusResponse]:
    """
    DEV ONLY: Instantly marks a PAYMENT_PENDING session as PAID_UNUSED.

    This simulates what would happen when the payment provider sends
    a confirmed webhook.  Only available when DEV_MOCK_PAYMENT=true.
    """
    if not settings.DEV_MOCK_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found.",  # Don't reveal the endpoint in production
        )

    data = await payment_service.confirm_payment_mock(db, payment_session_id, session["company_name"], session["hr_email"])
    return APIResponse(
        success=True,
        message=(
            f"[DEV] Payment simulated. Verification request {data.display_request_id} "
            "is now ready for candidate details."
        ),
        data=data,
    )
