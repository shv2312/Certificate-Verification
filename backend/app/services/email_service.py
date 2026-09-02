"""
app/services/email_service.py
==============================
Email OTP verification service.

Sprint 1 status:
  - Architecture and state machine are IMPLEMENTED.
  - In DEV_MOCK_OTP=true mode: OTP is generated, stored in memory,
    and LOGGED to console.  No real email is sent.  The OTP is also
    returned in the API response as 'dev_otp' (clearly marked dev-only).
  - In DEV_MOCK_OTP=false mode: Real SMTP via aiosmtplib.
    Requires valid SMTP_* settings in .env.

SECURITY REQUIREMENTS (implemented or documented):
  - OTP is 6 digits, cryptographically random (secrets module).
  - OTP is hashed before storage (bcrypt / PBKDF2) – NOT stored plaintext.
    Sprint 1 uses a keyed HMAC-SHA256 as a lightweight alternative while
    the full database layer is not yet wired in.
  - Expiry: OTP_EXPIRY_MINUTES (default 10 min).
  - Max attempts: OTP_MAX_ATTEMPTS (default 3) per challenge.
  - Resend cooldown: OTP_RESEND_COOLDOWN_SECONDS (default 60 s).
  - Single-use: challenge is invalidated after successful verification.
  - No plain OTP in production logs.

SPRINT 1 LIMITATIONS (documented blockers):
  - Challenges are stored in-process (Python dict) for Sprint 1.
    In production, they MUST be stored in Parthiban's PostgreSQL or Redis
    so they survive server restarts and work across multiple workers.
  - The session token issued after OTP verification is a signed HMAC token.
    A proper JWT or server-side session implementation should be agreed
    with the team before production deployment.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import secrets
import time
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.config import get_settings
from app.schemas.email_verification import SendOTPResponse, VerifyOTPResponse
from app.db.models import EmailChallenge, AdminAccount

logger = logging.getLogger(__name__)
settings = get_settings()


# ------------------------------------------------------------------ #
# Internal helpers                                                     #
# ------------------------------------------------------------------ #


# ------------------------------------------------------------------ #
# Internal helpers                                                     #
# ------------------------------------------------------------------ #
def _generate_otp() -> str:
    """Generate a cryptographically random 6-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _hmac_otp(otp: str) -> str:
    """
    HMAC-SHA256 of the OTP using the app secret key.
    This avoids storing the plain OTP while still being verifiable.
    """
    return hmac.new(
        settings.APP_SECRET_KEY.encode(),
        otp.encode(),
        hashlib.sha256,
    ).hexdigest()


def _mask_email(email: str) -> str:
    """Return a masked email for display: hr***@company.com"""
    local, domain = email.rsplit("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[:2] + "***"
    return f"{masked_local}@{domain}"


async def _send_otp_email(hr_email: str, company_name: str, otp: str) -> None:
    """
    Send the OTP via SMTP.

    In DEV_MOCK_OTP mode: logs to console only.
    In production mode: sends via aiosmtplib.

    Sprint 1: Production path raises NotImplementedError until real
    SMTP credentials are configured and tested.
    """
    if settings.DEV_MOCK_OTP:
        # NOTE: This log line is intentionally in plain text for development.
        # In production (DEV_MOCK_OTP=False) this path is NOT reached.
        logger.warning(
            "[DEV-ONLY] OTP for %s (%s): %s  |  "
            "THIS LOG LINE MUST NOT APPEAR IN PRODUCTION",
            hr_email,
            company_name,
            otp,
        )
        return

    # --- Production path (Sprint 2+) ---
    # Import here to avoid failing at startup when SMTP is not configured.
    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "SIET Background Verification – Email Verification Code"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = hr_email

        text_body = (
            f"Dear HR Representative ({company_name}),\n\n"
            f"Your email verification code is: {otp}\n\n"
            f"This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
            f"If you did not request this verification, please ignore this email.\n\n"
            f"Sri Shakthi Institute of Engineering and Technology"
        )
        msg.attach(MIMEText(text_body, "plain"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("OTP email dispatched to %s", _mask_email(hr_email))
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", _mask_email(hr_email), exc)
        raise


# ------------------------------------------------------------------ #
# Public service functions                                             #
# ------------------------------------------------------------------ #
async def create_and_send_otp(
    db: AsyncSession,
    company_name: str,
    hr_email: str,
) -> SendOTPResponse:
    """
    Create an OTP challenge and dispatch the OTP to the HR email.

    Returns:
        SendOTPResponse with masked email and cooldown info.
        In DEV_MOCK_OTP mode: also includes the plain OTP in dev_otp.

    Raises:
        ValueError: If a cooldown is still active for this email.
    """
    email_lower = hr_email.lower().strip()

    # Check for existing non-expired challenge with cooldown
    stmt = select(EmailChallenge).where(
        EmailChallenge.email == email_lower,
        EmailChallenge.verified == False
    )
    result = await db.execute(stmt)
    existing_challenges = result.scalars().all()
    
    current_time = int(time.time())
    for challenge in existing_challenges:
        if current_time - challenge.last_sent_at < settings.OTP_RESEND_COOLDOWN_SECONDS:
            wait = settings.OTP_RESEND_COOLDOWN_SECONDS - (current_time - challenge.last_sent_at)
            raise ValueError(
                f"Please wait {wait} seconds before requesting a new OTP."
            )

    # Generate new challenge
    otp = _generate_otp()
    challenge_id = secrets.token_urlsafe(32)

    challenge = EmailChallenge(
        id=challenge_id,
        company_name=company_name.strip(),
        email=email_lower,
        otp_hmac=_hmac_otp(otp),
        created_at=current_time,
        last_sent_at=current_time
    )
    db.add(challenge)
    await db.flush()

    # Send (or mock-log)
    await _send_otp_email(email_lower, company_name, otp)

    return SendOTPResponse(
        challenge_id=challenge_id,
        masked_email=_mask_email(email_lower),
        resend_allowed_after_seconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
        dev_otp=otp if settings.DEV_MOCK_OTP else None,
    )


async def verify_otp(
    db: AsyncSession,
    challenge_id: str,
    submitted_otp: str,
) -> VerifyOTPResponse:
    """
    Verify a submitted OTP against the stored challenge.

    Returns:
        VerifyOTPResponse with a session token on success.

    Raises:
        ValueError: On invalid challenge ID, expired OTP, max attempts
                    exceeded, or wrong OTP.
    """
    challenge = await db.get(EmailChallenge, challenge_id)
    if not challenge:
        raise ValueError("Invalid or expired verification session.")

    current_time = int(time.time())
    # Check expiry
    age_seconds = current_time - challenge.created_at
    if age_seconds > settings.OTP_EXPIRY_MINUTES * 60:
        await db.delete(challenge)
        await db.flush()
        raise ValueError("The OTP has expired. Please request a new one.")

    # Already verified
    if challenge.verified:
        raise ValueError("This verification session has already been used.")

    # Check max attempts
    if challenge.attempts >= settings.OTP_MAX_ATTEMPTS:
        await db.delete(challenge)
        await db.flush()
        raise ValueError(
            f"Maximum verification attempts ({settings.OTP_MAX_ATTEMPTS}) exceeded. "
            "Please request a new OTP."
        )

    # Verify OTP via HMAC comparison
    challenge.attempts += 1
    await db.flush()
    expected_hmac = _hmac_otp(submitted_otp.strip())
    if not hmac.compare_digest(expected_hmac, challenge.otp_hmac):
        remaining = settings.OTP_MAX_ATTEMPTS - challenge.attempts
        raise ValueError(
            f"Invalid OTP. {remaining} attempt(s) remaining."
        )

    # Mark verified and invalidate
    challenge.verified = True
    company_name = challenge.company_name
    hr_email = challenge.email
    # Clean up the store (single-use)
    await db.delete(challenge)
    await db.flush()

    # Issue a lightweight session token
    session_token = await _issue_session_token(db, company_name, hr_email)
    logger.info("Email verified for %s (%s)", _mask_email(hr_email), company_name)

    return VerifyOTPResponse(
        session_token=session_token,
        verified_company=company_name,
        verified_email=hr_email,
    )


async def _issue_session_token(db: AsyncSession, company_name: str, hr_email: str) -> str:
    """
    Issue a short-lived, signed session token after successful OTP verification.
    Includes role resolution.
    """
    stmt = select(AdminAccount).where(AdminAccount.email == hr_email, AdminAccount.is_active == True)
    result = await db.execute(stmt)
    admin_account = result.scalar_one_or_none()
    
    role = "ADMIN" if admin_account else "HR"
    
    timestamp = int(time.time())
    payload = f"{company_name}|{hr_email}|{role}|{timestamp}"
    signature = hmac.new(
        settings.APP_SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    # Encode as: base payload (url-safe b64) + "." + signature
    encoded_payload = base64.urlsafe_b64encode(payload.encode()).decode()
    return f"{encoded_payload}.{signature}"
