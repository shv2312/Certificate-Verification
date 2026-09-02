"""
app/schemas/payment.py
======================
Request and response schemas for the payment flow.

IMPORTANT DESIGN RULES (enforced here and in payment_service.py):
  1. Payment success must be confirmed SERVER-SIDE via the payment
     provider's callback/webhook mechanism.
  2. The frontend redirect to /payment-success does NOT constitute
     proof of payment.
  3. The backend only unlocks verification access AFTER the payment
     provider webhook is verified (signature checked).
  4. Payment gateway selection is PENDING college approval.
     DEV_MOCK_PAYMENT=true stubs the flow for Sprint 1 development.

Terminology:
  - payment_session_id:  Backend-generated ID that tracks this payment
                         attempt before and during the gateway interaction.
  - gateway_order_id:    The ID created on the payment provider's side.
                         (Razorpay: order_id, PayU: txnid, etc.)
  - gateway_payment_id:  The ID issued by the provider upon payment capture.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ------------------------------------------------------------------ #
# POST /api/v1/payment/initiate                                        #
# ------------------------------------------------------------------ #
class PaymentInitiateRequest(BaseModel):
    """
    Initiates a payment session.

    The session_token from email/verify-otp must accompany this request
    (sent as Authorization: Bearer <token>).

    verification_amount_paise is the amount in the smallest currency unit
    (paise for INR).  It is read from backend config – the frontend does
    NOT dictate price.
    """
    # No body fields required in Sprint 1 – amount comes from server config.
    # Future versions may accept a 'plan_id' if multiple verification tiers
    # are offered.
    pass


class PaymentInitiateResponse(BaseModel):
    """
    Response data after initiating a payment session.

    The frontend uses these values to open the payment gateway widget/redirect.
    """
    payment_session_id: str = Field(
        description="Backend payment session ID.  Send this back in the webhook."
    )
    # In DEV_MOCK_PAYMENT mode, gateway fields are stubs.
    gateway_order_id: str = Field(
        description="Order/transaction ID from the payment provider."
    )
    gateway_key_id: str = Field(
        description="Public API key for the payment gateway widget (NOT the secret)."
    )
    amount_paise: int = Field(
        description="Amount in smallest currency unit (paise for INR)."
    )
    currency: str = "INR"
    description: str = "SIET Academic Background Verification"


# ------------------------------------------------------------------ #
# POST /api/v1/payment/webhook                                         #
# (Called by payment provider, NOT by the frontend)                   #
# ------------------------------------------------------------------ #
class PaymentWebhookResponse(BaseModel):
    """Acknowledged response to payment gateway webhook."""
    acknowledged: bool = True


# ------------------------------------------------------------------ #
# GET /api/v1/payment/{payment_session_id}/status                     #
# ------------------------------------------------------------------ #
class PaymentStatusResponse(BaseModel):
    """
    Polling endpoint for the frontend to check payment status.

    verification_request_id is populated only after a successful payment
    and is the ID the frontend uses on subsequent verification endpoints.
    """
    payment_session_id: str
    status: str  # PENDING | PAID_UNUSED | FAILED | EXPIRED
    verification_request_id: str | None = None
    # Human-readable request ID (e.g. BGV-2026-000001)
    display_request_id: str | None = None
