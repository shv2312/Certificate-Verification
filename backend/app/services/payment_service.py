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

import json
import logging
import secrets
import time
from typing import Optional

import razorpay
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.models import PaymentSession, VerificationRequest
from app.schemas.payment import PaymentInitiateResponse, PaymentStatusResponse

logger = logging.getLogger(__name__)
settings = get_settings()

_request_counter = 0


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
# Internal helpers                                                     #
# ------------------------------------------------------------------ #


def _generate_display_request_id() -> str:
    """
    Generate a human-readable verification request ID.
    Example: BGV-2026-000001
    """
    global _request_counter
    _request_counter += 1
    year = time.strftime("%Y")
    return f"BGV-{year}-{_request_counter:06d}"


# ------------------------------------------------------------------ #
# Public service functions                                            #
# ------------------------------------------------------------------ #
async def initiate_payment(
    db: AsyncSession,
    company_name: str,
    hr_email: str,
    hr_name: str = "",
    hr_phone: str = "",
) -> PaymentInitiateResponse:
    """
    Create a payment session and return gateway details to the frontend.
    """
    payment_session_id = secrets.token_urlsafe(32)
    amount_paise = 50000  # ₹500
    
    if settings.DEV_MOCK_PAYMENT:
        gateway_order_id = f"DEV_ORDER_{secrets.token_hex(8).upper()}"
        gateway_key_id = "DEV_KEY_ID_NOT_REAL"
        logger.warning(
            "[DEV-ONLY] Mock payment session created: %s | "
            "THIS IS NOT A REAL PAYMENT",
            payment_session_id,
        )
    else:
        # Razorpay Test Mode Integration
        try:
            client = razorpay.Client(auth=(settings.PAYMENT_GATEWAY_KEY_ID, settings.PAYMENT_GATEWAY_KEY_SECRET))
            order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": payment_session_id,
                "notes": {
                    "company_name": company_name,
                    "hr_email": hr_email,
                    "hr_name": hr_name,
                    "hr_phone": hr_phone
                }
            })
            gateway_order_id = order["id"]
            gateway_key_id = settings.PAYMENT_GATEWAY_KEY_ID
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {str(e)}")
            raise ValueError("Payment gateway error. Please try again later.")

    session = PaymentSession(
        id=payment_session_id,
        gateway_order_id=gateway_order_id,
        amount_paise=amount_paise,
        status="PAYMENT_PENDING",
        created_at=int(time.time()),
    )
    db.add(session)
    await db.flush()

    return PaymentInitiateResponse(
        payment_session_id=payment_session_id,
        gateway_order_id=gateway_order_id,
        gateway_key_id=gateway_key_id,
        amount_paise=amount_paise,
    )


async def process_payment_webhook(
    db: AsyncSession,
    raw_body: bytes,
    signature_header: str,
) -> bool:
    """
    Process a payment provider webhook and update payment state atomically.
    """
    if settings.DEV_MOCK_PAYMENT:
        logger.warning("[DEV-ONLY] Webhook received but mock mode is active – ignoring.")
        return False

    client = razorpay.Client(auth=(settings.PAYMENT_GATEWAY_KEY_ID, settings.PAYMENT_GATEWAY_KEY_SECRET))
    payload = raw_body.decode('utf-8')
    try:
        client.utility.verify_webhook_signature(payload, signature_header, settings.PAYMENT_GATEWAY_WEBHOOK_SECRET)
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {str(e)}")
        raise ValueError("Invalid signature")

    data = json.loads(payload)
    event = data.get('event')

    if event in ['payment.captured', 'order.paid']:
        if event == 'order.paid':
            entity = data['payload']['order']['entity']
        else:
            entity = data['payload']['payment']['entity']

        # Determine receipt and notes based on event type structure in Razorpay.
        # usually order contains the receipt and notes. In payment.captured it's under payload.payment.entity.
        # But wait, in order.paid, it's payload.order.entity.
        if 'receipt' in entity:
            payment_session_id = entity['receipt']
        else:
            # Fallback to fetching order if it's a payment entity without receipt
            order_id = entity.get('order_id')
            if not order_id:
                logger.error("No order ID or receipt found in payload.")
                return False
            order = client.order.fetch(order_id)
            payment_session_id = order['receipt']
            entity = order # use order for notes
            
        notes = entity.get('notes', {})
        company_name = notes.get('company_name', 'Unknown Company')
        hr_email = notes.get('hr_email', 'unknown@siet.ac.in')
        hr_name = notes.get('hr_name', '')
        hr_phone = notes.get('hr_phone', '')

        # Atomically lock and update the session
        stmt = select(PaymentSession).where(PaymentSession.id == payment_session_id).with_for_update()
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            logger.error(f"Webhook received for unknown payment_session_id: {payment_session_id}")
            return False

        if session.status == "PAYMENT_PENDING":
            verification_request_id = secrets.token_urlsafe(24)
            display_id = _generate_display_request_id()

            session.status = "PAID_UNUSED"
            session.verification_request_id = verification_request_id

            v_req = VerificationRequest(
                id=verification_request_id,
                display_request_id=display_id,
                status="PAID_UNUSED",
                company_name=company_name,
                hr_email=hr_email,
                hr_name=hr_name,
                hr_phone=hr_phone,
                created_at=int(time.time()),
                payment_session_id=payment_session_id
            )
            db.add(v_req)
            await db.flush()
            
            logger.info(f"Payment {payment_session_id} captured. Created Request {display_id}")
            return True
        else:
            logger.info(f"Payment session {payment_session_id} already processed (Status: {session.status}). Idempotent return.")
            return True

    return False


async def verify_checkout_signature(
    db: AsyncSession,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
    company_name: str,
    hr_email: str,
    hr_name: str = "",
    hr_phone: str = ""
) -> PaymentStatusResponse:
    """
    Verify the signature returned directly to the frontend after checkout.
    Updates the payment session synchronously to unblock the user immediately,
    handling the case where this races with the async webhook.
    """
    if settings.DEV_MOCK_PAYMENT:
        raise ValueError("Cannot verify real checkout signature in mock mode.")

    client = razorpay.Client(auth=(settings.PAYMENT_GATEWAY_KEY_ID, settings.PAYMENT_GATEWAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
    except Exception as e:
        logger.error(f"Checkout signature verification failed: {str(e)}")
        raise ValueError("Invalid checkout signature")

    # Fetch order to map gateway_order_id to payment_session_id
    try:
        order = client.order.fetch(razorpay_order_id)
        payment_session_id = order['receipt']
    except Exception as e:
        logger.error(f"Failed to fetch order for checkout verify: {str(e)}")
        raise ValueError("Could not resolve payment session")

    # Atomic update
    stmt = select(PaymentSession).where(PaymentSession.id == payment_session_id).with_for_update()
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise ValueError(f"Payment session not found: {payment_session_id}")

    if session.status == "PAYMENT_PENDING":
        verification_request_id = secrets.token_urlsafe(24)
        display_id = _generate_display_request_id()

        session.status = "PAID_UNUSED"
        session.verification_request_id = verification_request_id

        v_req = VerificationRequest(
            id=verification_request_id,
            display_request_id=display_id,
            status="PAID_UNUSED",
            company_name=company_name,
            hr_email=hr_email,
            hr_name=hr_name,
            hr_phone=hr_phone,
            created_at=int(time.time()),
            payment_session_id=payment_session_id
        )
        db.add(v_req)
        await db.flush()
        logger.info(f"Checkout verified. Created Request {display_id}")
    else:
        logger.info(f"Checkout verified but session already processed (Status: {session.status}).")
        # Fetch existing VerificationRequest display_id
        if session.verification_request_id:
            v_req = await db.get(VerificationRequest, session.verification_request_id)
            display_id = v_req.display_request_id if v_req else None
        else:
            display_id = None

    return PaymentStatusResponse(
        payment_session_id=session.id,
        status=session.status,
        verification_request_id=session.verification_request_id,
        display_request_id=display_id,
    )


async def confirm_payment_mock(db: AsyncSession, payment_session_id: str, company_name: str, hr_email: str, hr_name: str = "", hr_phone: str = "") -> PaymentStatusResponse:
    """
    DEV-ONLY: Simulate a successful payment callback.
    """
    if not settings.DEV_MOCK_PAYMENT:
        raise PermissionError("Mock payment confirmation is disabled in this environment.")

    session = await db.get(PaymentSession, payment_session_id)
    if not session:
        raise ValueError(f"Payment session not found: {payment_session_id}")

    if session.status != "PAYMENT_PENDING":
        raise ValueError(
            f"Payment session is in state '{session.status}', cannot confirm again."
        )

    verification_request_id = secrets.token_urlsafe(24)
    display_id = _generate_display_request_id()

    session.status = "PAID_UNUSED"
    session.verification_request_id = verification_request_id
    
    v_req = VerificationRequest(
        id=verification_request_id,
        display_request_id=display_id,
        status="PAID_UNUSED",
        company_name=company_name,
        hr_email=hr_email,
        hr_name=hr_name,
        hr_phone=hr_phone,
        created_at=int(time.time()),
        payment_session_id=payment_session_id
    )
    db.add(v_req)
    await db.flush()

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


async def get_payment_status(db: AsyncSession, payment_session_id: str) -> PaymentStatusResponse:
    """Return the current status of a payment session."""
    session = await db.get(PaymentSession, payment_session_id)
    if not session:
        raise ValueError(f"Payment session not found: {payment_session_id}")

    display_request_id = None
    if session.verification_request_id:
        v_req = await db.get(VerificationRequest, session.verification_request_id)
        if v_req:
            display_request_id = v_req.display_request_id

    return PaymentStatusResponse(
        payment_session_id=payment_session_id,
        status=session.status,
        verification_request_id=session.verification_request_id,
        display_request_id=display_request_id,
    )


async def get_session_by_request_id(db: AsyncSession, verification_request_id: str) -> Optional[PaymentSession]:
    """
    Look up a payment session by its verification_request_id.
    """
    stmt = select(PaymentSession).where(PaymentSession.verification_request_id == verification_request_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
