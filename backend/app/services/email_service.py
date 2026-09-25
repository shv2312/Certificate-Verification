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


import json
import os

outbox: list[tuple[str, str, str]] = []  # For testing: (hr_email, company_name, otp)

def _write_local_capture_mailbox(hr_email: str, company_name: str, otp: str):
    if not os.getenv("PYTEST_CURRENT_TEST"):
        return
    import tempfile
    mailbox_file = os.path.join(tempfile.gettempdir(), "siet_test_mailbox.json")
    mailbox = []
    if os.path.exists(mailbox_file):
        try:
            with open(mailbox_file, "r") as f:
                mailbox = json.load(f)
        except Exception:
            pass
    mailbox.append({"email": hr_email, "company": company_name, "otp": otp})
    with open(mailbox_file, "w") as f:
        json.dump(mailbox, f)

async def _send_otp_email(hr_email: str, company_name: str, otp: str) -> None:
    """
    Send the OTP via SMTP.

    In DEV_MOCK_OTP mode: captures the OTP in an outbox for testing.
    In production mode: sends via aiosmtplib.

    Sprint 1: Production path raises NotImplementedError until real
    SMTP credentials are configured and tested.
    """
    if settings.DEV_MOCK_OTP:
        outbox.append((hr_email, company_name, otp))
        _write_local_capture_mailbox(hr_email, company_name, otp)
        logger.warning(
            "[DEV-ONLY] Simulated OTP email dispatched for %s (%s). OTP: %s",
            hr_email,
            company_name,
            otp
        )
        return

    # --- Production path ---
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

        logger.info(
            "[SMTP] Connecting to %s:%s to dispatch OTP email to %s ...",
            settings.SMTP_HOST, settings.SMTP_PORT, _mask_email(hr_email),
        )
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("[SMTP] OTP email successfully delivered to %s", _mask_email(hr_email))
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", _mask_email(hr_email), exc)
        raise ValueError("Failed to deliver OTP email. Please verify the address and try again.")


# ------------------------------------------------------------------ #
# Public service functions                                             #
# ------------------------------------------------------------------ #
async def create_and_send_otp(
    db: AsyncSession,
    company_name: str,
    hr_email: str,
    hr_name: str,
    hr_phone: str,
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
        else:
            # Delete expired or superseded challenge
            await db.delete(challenge)
    
    await db.flush()

    # Generate new challenge
    otp = _generate_otp()
    challenge_id = secrets.token_urlsafe(32)

    challenge = EmailChallenge(
        id=challenge_id,
        company_name=company_name.strip(),
        email=email_lower,
        hr_name=hr_name.strip(),
        hr_phone=hr_phone.strip(),
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
    session_token, role = await _issue_session_token(db, company_name, hr_email, challenge.hr_name, challenge.hr_phone)
    logger.info("Email verified for %s (%s)", _mask_email(hr_email), company_name)

    return VerifyOTPResponse(
        session_token=session_token,
        verified_company=company_name,
        verified_email=hr_email,
        role=role.lower()
    )


async def _issue_session_token(db: AsyncSession, company_name: str, hr_email: str, hr_name: str, hr_phone: str) -> tuple[str, str]:
    """
    Issue a short-lived, signed session token after successful OTP verification.
    Includes role resolution.
    """
    stmt = select(AdminAccount).where(AdminAccount.email == hr_email, AdminAccount.is_active == True)
    result = await db.execute(stmt)
    admin_account = result.scalar_one_or_none()
    
    role = "ADMIN" if admin_account else "HR"
    
    timestamp = int(time.time())
    
    # Safely handle None values from legacy DB records
    safe_hr_name = hr_name or ""
    safe_hr_phone = hr_phone or ""
    payload = f"{company_name}|{hr_email}|{role}|{timestamp}|{safe_hr_name}|{safe_hr_phone}"
    signature = hmac.new(
        settings.APP_SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    # Encode as: base payload (url-safe b64) + "." + signature
    encoded_payload = base64.urlsafe_b64encode(payload.encode()).decode()
    return f"{encoded_payload}.{signature}", role


# ------------------------------------------------------------------ #
# Verification Report Email                                            #
# ------------------------------------------------------------------ #

def _build_report_html(report: dict, company_name: str) -> str:
    """
    Render a clean HTML email body summarising a completed verification.
    Works for both VERIFIED and NOT_VERIFIED outcomes.
    """
    status = report.get("status", "UNKNOWN")
    status_color = "#2e7d32" if status == "VERIFIED" else "#c62828"
    status_label = "✔ VERIFIED" if status == "VERIFIED" else "✘ NOT VERIFIED"

    def row(label: str, value, verify_val="Y") -> str:
        display = value if value not in (None, "", "null") else "-"
        return (
            f"<tr>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e0e0e0;font-weight:600;color:#37474f;'>{label}</td>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e0e0e0;color:#212121;'>{display}</td>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center;font-weight:bold;color:#2e7d32;'>{verify_val}</td>"
            f"<td style='padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center;'>-</td>"
            f"</tr>"
        )

    rows_html = ""
    if status == "VERIFIED":
        backlog_val = report.get("backlog_status", "No Backlogs")
        verify_backlog = "NO" if "No" in str(backlog_val) else "YES"
        
        rows_html = "".join([
            row("Candidate Name", report.get("candidate_name")),
            row("Institute Name", "Sri Shakthi Institute of Engineering and Technology, Coimbatore"),
            row("University Name", "Anna University, Chennai"),
            row("Course Name", report.get("course", "Bachelor of Engineering")),
            row("Specialization", report.get("branch")),
            row("Roll No/ Reg. No", report.get("register_number")),
            row("Year of Passing", report.get("year_of_passing")),
            row("Backlog Status", "Confirmed", verify_backlog),
            row("Date Attend / Period of Study", report.get("period_of_study")),
            row("Mode Of Education", "Regular"),
        ])
        
        table_html = (
            "<table style='width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;'>"
            "<thead><tr style='background:#f1f5f9;'>"
            "<th style='padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;'>Details</th>"
            "<th style='padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;'>Candidate's Input</th>"
            "<th style='padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;'>Verification (Y/N)</th>"
            "<th style='padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;'>Comments</th>"
            "</tr></thead>"
            "<tbody>" + rows_html + "</tbody></table>"
        )
    else:
        table_html = '<p style="color:#c62828;font-weight:600;">The submitted candidate details could not be matched against the official institutional records.</p>'

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Verification Report</title></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
      <div style="max-width:800px;margin:0 auto;background:#fff;
                  border-radius:8px;overflow:hidden;
                  box-shadow:0 2px 8px rgba(0,0,0,.12);">

        <!-- Header -->
        <div style="background:#1a237e;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">
            SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY
          </h1>
          <p style="margin:4px 0 0;color:#c5cae9;font-size:13px;">
            COIMBATORE - 641 062 (Affiliated to Anna University, Chennai)
          </p>
        </div>

        <!-- Status banner -->
        <div style="background:{status_color};padding:16px 32px;">
          <p style="margin:0;color:#fff;font-size:16px;font-weight:700;">
            {status_label}
          </p>
        </div>

        <!-- Body -->
        <div style="padding:24px 32px;">
          <p style="color:#37474f;margin-top:0;">
            Dear <strong>{company_name}</strong>,<br/>
            Please find attached the official academic background verification report for your candidate.
          </p>

          {table_html}

          <div style="margin-top:40px;text-align:right;">
             <p style="margin:0;font-weight:bold;color:#1e293b;font-size:14px;">DR K E KANNAMMAL</p>
             <p style="margin:4px 0;color:#475569;font-size:13px;">HOD / Academic Verification Officer</p>
             <p style="margin:0;color:#475569;font-size:13px;">verification@siet.ac.in</p>
          </div>

          <p style="color:#78909c;font-size:12px;margin-top:24px;border-top:1px solid #e0e0e0;padding-top:16px;">
            This report was generated automatically. Do not reply to this email.
            For disputes, contact the institution directly.
          </p>
        </div>


        <!-- Footer -->
        <div style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
          <p style="margin:0;color:#9e9e9e;font-size:11px;">
            © Sri Shakthi Institute of Engineering and Technology — Confidential
          </p>
        </div>
      </div>
    </body>
    </html>
    """


async def send_verification_report_email(
    hr_email: str,
    company_name: str,
    report: dict,
) -> None:
    """
    Dispatch the completed verification report to the HR's verified email.

    This is designed to be called as a FastAPI BackgroundTask so that
    SMTP latency never blocks the API response.

    Failures are logged but never re-raised — the verification DB
    transaction must not be affected by email delivery issues.
    """
    try:
        if settings.DEV_MOCK_OTP:
            # In dev mode just log it – don't attempt real SMTP
            logger.warning(
                "[DEV-ONLY] Verification report email simulated for %s (%s). Status: %s",
                _mask_email(hr_email),
                company_name,
                report.get("status"),
            )
            return

        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        status = report.get("status", "UNKNOWN")
        subject = (
            "SIET Verification Report – Candidate VERIFIED"
            if status == "VERIFIED"
            else "SIET Verification Report – Candidate NOT VERIFIED"
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = hr_email

        html_body = _build_report_html(report, company_name)
        msg.attach(MIMEText(html_body, "html"))

        if status == "VERIFIED":
            from app.services.pdf_service import generate_verification_pdf
            from email.mime.application import MIMEApplication
            pdf_buffer = generate_verification_pdf(report)
            pdf_attachment = MIMEApplication(pdf_buffer.read(), _subtype="pdf")
            pdf_filename = f"SIET_Verification_{report.get('display_request_id', 'report')}.pdf"
            pdf_attachment.add_header('Content-Disposition', f'attachment; filename="{pdf_filename}"')
            msg.attach(pdf_attachment)

        logger.info(
            "[SMTP] Connecting to %s:%s to dispatch verification report to %s (status: %s) ...",
            settings.SMTP_HOST, settings.SMTP_PORT, _mask_email(hr_email), status,
        )
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(
            "[SMTP] Verification report successfully delivered to %s (status: %s)",
            _mask_email(hr_email),
            status,
        )
    except Exception as exc:
        # Log the failure but DO NOT raise — report email must never block
        # or roll back the successful verification database record.
        logger.error(
            "Failed to send verification report to %s: %s",
            _mask_email(hr_email),
            exc,
        )
