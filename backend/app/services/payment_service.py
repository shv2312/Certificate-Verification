"""
app/services/payment_service.py
================================
Payment session service for the SIET BGV backend.

Sprint 1 status:
  - State machine and architecture are IMPLEMENTED.
  - DEV_MOCK_PAYMENT=true: payment is simulated in-process with a
    fake 'confirm' endpoint.  No real gateway is called.
  - DEV_MOCK_PAYMENT=false: requires a real payment gateway to be
    selected and approved by SIET management before implementation.

CRITICAL DESIGN RULES:
  1. Payment success is NEVER determined by a frontend redirect.
     Only a verified webhook/callback from the payment provider
     (with server-side signature verification) updates payment state
     to PAID_UNUSED.
  2. The payment gateway key SECRET must NEVER be sent to the frontend.
     Only the public key_id is sent in PaymentInitiateResponse.
  3. One payment = one candidate verification.  This is enforced in
     both this service and (eventually) in Parthiban's database via
     atomic transactions and unique constraints.

Sprint 1 LIMITATIONS (documented blockers):
  - Payment sessions are stored in-process (Python dict).
    In production: store in Parthiban's PostgreSQL with proper ACID
    transactions to handle concurrency (two requests consuming one payment).
  - The mock 'confirm' endpoint must be REMOVED before production.
  - No real payment gateway selected yet (pending college approval).
"""

from __future__ import annotations

import logging
import secrets
import time
from dataclasses import dataclass, field
from typing import Dict, Optional

from app.config import get_settings
from app.schemas.payment import PaymentInitiateResponse, PaymentStatusResponse

logger = logging.getLogger(__name__)
settings = get_settings()


# ------------------------------------------------------------------ #
# Verification Request Lifecycle States                               #
# ------------------------------------------------------------------ #
# This state machine must match Parthiban's database enum when integrated.
# Do NOT change state names without coordinating with Parthiban.
#
# EMAIL_NOT_VERIFIED → EMAIL_OTP_SENT → EMAIL_VERIFIED
#   → PAYMENT_PENDING → PAID_UNUSED → CANDIDATE_BOUND
#   → VERIFICATION_IN_PROGRESS → VERIFIED | NOT_VERIFIED → COMPLETED
#
class RequestStatus:
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    EMAIL_OTP_SENT = "EMAIL_OTP_SENT"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID_UNUSED = "PAID_UNUSED"
    CANDIDATE_BOUND = "CANDIDATE_BOUND"
    VERIFICATION_IN_PROGRESS = "VERIFICATION_IN_PROGRESS"
    VERIFIED = "VERIFIED"
    NOT_VERIFIED = "NOT_VERIFIED"
    COMPLETED = "COMPLETED"


# ------------------------------------------------------------------ #
# In-process payment session store (Sprint 1 only)                   #
# ------------------------------------------------------------------ #
@dataclass
class _PaymentSession:
    payment_session_id: str
    gateway_order_id: str
    company_name: str
    hr_email: str
    amount_paise: int
    status: str  # PAYMENT_PENDING | PAID_UNUSED | FAILED | EXPIRED
    created_at: float = field(default_factory=time.time)
    verification_request_id: Optional[str] = None
    display_request_id: Optional[str] = None


_payment_store: Dict[str, _PaymentSession] = {}   # payment_session_id → session
_request_counter: int = 0  # used for human-readable IDs (Sprint 1 only)


def _generate_display_request_id() -> str:
    """
    Generate a human-readable verification request ID.
    Example: BGV-2026-000001

    SECURITY NOTE: This ID is for human identification only.
    Do NOT use it as an authorization key.  The backend must always
    verify session ownership before accepting actions on any request ID.

    Sprint 1: counter-based.  In production: use a database sequence.
    """
    global _request_counter
    _request_counter += 1
    year = time.strftime("%Y")
    return f"BGV-{year}-{_request_counter:06d}"


# ------------------------------------------------------------------ #
# Public service functions                                            #
# ------------------------------------------------------------------ #
async def initiate_payment(
    company_name: str,
    hr_email: str,
) -> PaymentInitiateResponse:
    """
    Create a payment session and return gateway details to the frontend.

    In DEV_MOCK_PAYMENT mode: returns fake gateway fields.
    In production mode: calls payment provider API to create an order,
    then returns the real order_id and key_id.

    The frontend uses these details to open the payment gateway widget.
    """
    payment_session_id = secrets.token_urlsafe(32)

    if settings.DEV_MOCK_PAYMENT:
        gateway_order_id = f"DEV_ORDER_{secrets.token_hex(8).upper()}"
        gateway_key_id = "DEV_KEY_ID_NOT_REAL"
        amount_paise = 50000  # ₹500 – placeholder; real amount from config
        logger.warning(
            "[DEV-ONLY] Mock payment session created: %s | "
            "THIS IS NOT A REAL PAYMENT",
            payment_session_id,
        )
    else:
        # Production: call payment provider API here.
        # Gateway selection is PENDING college approval.
        raise NotImplementedError(
            "Production payment gateway not yet configured. "
            "Set DEV_MOCK_PAYMENT=true for development."
        )

    session = _PaymentSession(
        payment_session_id=payment_session_id,
        gateway_order_id=gateway_order_id,
        company_name=company_name,
        hr_email=hr_email,
        amount_paise=amount_paise,
        status="PAYMENT_PENDING",
    )
    _payment_store[payment_session_id] = session

    return PaymentInitiateResponse(
        payment_session_id=payment_session_id,
        gateway_order_id=gateway_order_id,
        gateway_key_id=gateway_key_id,
        amount_paise=amount_paise,
    )


async def confirm_payment_mock(payment_session_id: str) -> PaymentStatusResponse:
    """
    DEV-ONLY: Simulate a successful payment callback.

    This endpoint MUST be removed or disabled (DEV_MOCK_PAYMENT=false)
    before the backend is deployed to any public-facing environment.

    In production, payment state is updated ONLY via the payment
    provider's webhook (see process_payment_webhook).
    """
    if not settings.DEV_MOCK_PAYMENT:
        raise PermissionError("Mock payment confirmation is disabled in this environment.")

    session = _payment_store.get(payment_session_id)
    if not session:
        raise ValueError(f"Payment session not found: {payment_session_id}")

    if session.status != "PAYMENT_PENDING":
        raise ValueError(
            f"Payment session is in state '{session.status}', cannot confirm again."
        )

    # Simulate successful payment confirmation
    verification_request_id = secrets.token_urlsafe(24)
    display_id = _generate_display_request_id()

    session.status = "PAID_UNUSED"
    session.verification_request_id = verification_request_id
    session.display_request_id = display_id

    logger.warning(
        "[DEV-ONLY] Mock payment confirmed: %s → request %s (%s)",
        payment_session_id,
        verification_request_id,
        display_id,
    )

    return PaymentStatusResponse(
        payment_session_id=payment_session_id,
        status="PAID_UNUSED",
        verification_request_id=verification_request_id,
        display_request_id=display_id,
    )


async def process_payment_webhook(
    raw_body: bytes,
    signature_header: str,
) -> bool:
    """
    Process a payment provider webhook and update payment state.

    This function must:
      1. Verify the webhook signature using PAYMENT_GATEWAY_WEBHOOK_SECRET.
      2. Parse the event payload.
      3. On 'payment.captured' / equivalent: update session to PAID_UNUSED.

    Sprint 1: NOT implemented (no gateway selected).
    Returns False in mock mode and raises NotImplementedError in production mode.

    When implementing for production:
      - Use hmac.compare_digest for signature comparison.
      - Parse the event type from the payload.
      - Never trust gateway-provided amount; verify against the stored session.

    BLOCKER: Awaiting college approval for payment gateway selection.
    """
    if settings.DEV_MOCK_PAYMENT:
        logger.warning("[DEV-ONLY] Webhook received but mock mode is active – ignoring.")
        return False

    raise NotImplementedError(
        "Payment webhook processing not yet implemented. "
        "Awaiting college approval for payment gateway selection."
    )


async def get_payment_status(payment_session_id: str) -> PaymentStatusResponse:
    """Return the current status of a payment session."""
    session = _payment_store.get(payment_session_id)
    if not session:
        raise ValueError(f"Payment session not found: {payment_session_id}")

    return PaymentStatusResponse(
        payment_session_id=payment_session_id,
        status=session.status,
        verification_request_id=session.verification_request_id,
        display_request_id=session.display_request_id,
    )


def get_session_by_request_id(verification_request_id: str) -> Optional[_PaymentSession]:
    """
    Look up a payment session by its verification_request_id.
    Used by the verification service to confirm payment ownership.
    """
    for session in _payment_store.values():
        if session.verification_request_id == verification_request_id:
            return session
    return None
