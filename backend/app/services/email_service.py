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
import html
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
        dev_otp=otp if settings.DEV_MOCK_OTP else None,
    )



async def resend_otp(
    db: AsyncSession,
    challenge_id: str,
) -> SendOTPResponse:
    """
    Regenerate and resend the OTP for an existing, unverified challenge.

    Enforces the same resend cooldown as create_and_send_otp.
    On success, the old OTP is invalidated (new HMAC stored) and a fresh
    6-digit OTP is dispatched to the same email address.

    Returns:
        SendOTPResponse (same shape as send-otp) with the same challenge_id.

    Raises:
        ValueError: If challenge not found, already verified, or cooldown active.
    """
    challenge = await db.get(EmailChallenge, challenge_id)
    if not challenge:
        raise ValueError("Invalid or expired verification session. Please start over.")

    if challenge.verified:
        raise ValueError("This email address has already been verified.")

    current_time = int(time.time())
    # Enforce cooldown
    seconds_since_last = current_time - challenge.last_sent_at
    if seconds_since_last < settings.OTP_RESEND_COOLDOWN_SECONDS:
        wait = settings.OTP_RESEND_COOLDOWN_SECONDS - seconds_since_last
        raise ValueError(f"Please wait {wait} seconds before requesting a new code.")

    # Generate a fresh OTP and reset the challenge (same challenge_id preserved)
    otp = _generate_otp()
    challenge.otp_hmac = _hmac_otp(otp)
    challenge.attempts = 0
    challenge.last_sent_at = current_time
    # Reset creation time so the expiry window is fresh
    challenge.created_at = current_time
    await db.flush()

    await _send_otp_email(challenge.email, challenge.company_name, otp)

    logger.info(
        "OTP resent for challenge %s to %s (%s)",
        challenge_id[:8] + "…",
        _mask_email(challenge.email),
        challenge.company_name,
    )

    return SendOTPResponse(
        challenge_id=challenge_id,
        masked_email=_mask_email(challenge.email),
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
    Uses responsive fixed-layout table geometry optimized for mobile screens.
    """
    status = report.get("status", "UNKNOWN")
    status_color = "#073822" if status == "VERIFIED" else "#991b1b"
    status_label = "✔ VERIFIED" if status == "VERIFIED" else "✘ NOT VERIFIED"

    verifier_comment = str(
        report.get("verification_remarks")
        or report.get("admin_remarks")
        or report.get("comments")
        or report.get("remarks")
        or (
            "All academic credentials verified and matched against autonomous institutional records."
            if status == "VERIFIED"
            else "Discrepancy noted: Candidate record not found in the autonomous institutional ledger."
        )
    ).strip()

    def row(field_title: str, candidate_value, status_badge="YES", comment="—") -> str:
        display = html.escape(str(candidate_value)) if candidate_value not in (None, "", "null") else "—"
        badge_color = "#047857" if status_badge in ("YES", "Y", "✔") else "#dc2626"
        c_text = html.escape(str(comment)) if comment not in (None, "", "null") else "—"
        return (
            '<tr style="border-bottom: 1px solid #e2e8f0;">'
            f'<td style="padding: 8px 4px; font-weight: 600; color: #1e293b;">{html.escape(str(field_title))}</td>'
            f'<td style="padding: 8px 4px; color: #334155;">{display}</td>'
            f'<td style="padding: 8px 2px; text-align: center; font-weight: bold; color: {badge_color};">{html.escape(str(status_badge))}</td>'
            f'<td style="padding: 8px 2px; text-align: center; color: #475569;">{c_text}</td>'
            '</tr>'
        )

    rows_html = ""
    if status == "VERIFIED":
        standing_arrears = report.get("standing_arrears", 0)
        has_arrears = False
        if isinstance(standing_arrears, int) and standing_arrears > 0:
            has_arrears = True
        else:
            raw_backlog = str(report.get("backlog_status", "")).strip().lower()
            if raw_backlog and raw_backlog not in ("no backlogs", "none", "0", "no", "clear", "no standing arrears", "-"):
                has_arrears = True

        if not has_arrears:
            backlog_input = "No Standing Arrears"
            backlog_verif = "Verified Clear"
            backlog_notes = "All semesters cleared"
        else:
            arrears_count = standing_arrears if (isinstance(standing_arrears, int) and standing_arrears > 0) else 1
            backlog_input = f"{arrears_count} Standing Arrear(s)"
            backlog_verif = "YES"
            backlog_notes = "Pending backlogs"
        
        rows_html = "".join([
            row("Candidate Name", report.get("candidate_name")),
            row("Institute Name", "Sri Shakthi Institute of Engineering and Technology, Coimbatore"),
            row("University Name", "Anna University, Chennai"),
            row("Course Name", report.get("course", "Bachelor of Engineering")),
            row("Specialization", report.get("branch")),
            row("Roll No/ Reg. No", report.get("register_number")),
            row("Year of Passing", report.get("year_of_passing")),
            row("Backlog Status", backlog_input, backlog_verif, backlog_notes),
            row("Date Attend / Period of Study", report.get("period_of_study")),
            row("Mode Of Education", report.get("entry_mode") or "Regular"),
            row("Verifier's Remarks", "Official Record Match", "YES", verifier_comment),
        ])
        
        table_html = f"""
  <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #065f46;">Verifier's Remarks</p>
    <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.4;">{html.escape(verifier_comment)}</p>
  </div>
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box;">
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; margin-top: 15px; word-break: break-word;">
      <thead>
        <tr style="border-bottom: 2px solid #073822; background-color: #f8fafc;">
          <th style="width: 26%; text-align: left; padding: 8px 4px; font-size: 11px; color: #475569; text-transform: uppercase;">Details</th>
          <th style="width: 38%; text-align: left; padding: 8px 4px; font-size: 11px; color: #475569; text-transform: uppercase;">Candidate's Input</th>
          <th style="width: 12%; text-align: center; padding: 8px 2px; font-size: 11px; color: #475569; text-transform: uppercase;">Status</th>
          <th style="width: 24%; text-align: center; padding: 8px 2px; font-size: 11px; color: #475569; text-transform: uppercase;">Comments</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>
  </div>
"""
    else:
        table_html = f"""
  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #991b1b;">Verifier's Remarks / Audit Finding</p>
    <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.4;">{html.escape(verifier_comment)}</p>
  </div>
  <p style="color:#c62828;font-weight:600;margin:18px 0;">The submitted candidate details could not be verified against the official autonomous institutional records.</p>
"""

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Report</title>
    </head>
    <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;background:#f5f5f5;margin:0;padding:12px;box-sizing:border-box;">
      <div style="width:100%;max-width:650px;margin:0 auto;background:#fff;
                  border-radius:8px;overflow:hidden;box-sizing:border-box;
                  box-shadow:0 2px 8px rgba(0,0,0,.12);">

        <!-- Header -->
        <div style="background:#073822;padding:20px 24px;color:#fff;">
          <h1 style="margin:0;color:#fff;font-size:17px;font-weight:700;">
            SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY
          </h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:12px;">
            COIMBATORE - 641 062 (Affiliated to Anna University, Chennai)
          </p>
        </div>

        <!-- Status banner -->
        <div style="background:{status_color};padding:14px 24px;">
          <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">
            {status_label}
          </p>
        </div>

        <!-- Body -->
        <div style="padding:20px 16px;box-sizing:border-box;">
          <p style="color:#37474f;margin-top:0;font-size:14px;line-height:1.5;">
            Dear <strong>{html.escape(str(company_name))}</strong>,<br/>
            Please find attached the official academic background verification report for your candidate.
          </p>

          {table_html}

          <div style="margin-top:30px;text-align:right;">
             <p style="margin:0;font-weight:bold;color:#1e293b;font-size:13px;">DR K E KANNAMMAL</p>
             <p style="margin:3px 0;color:#475569;font-size:12px;">HOD / Academic Verification Officer</p>
             <p style="margin:0;color:#475569;font-size:12px;">verification@siet.ac.in</p>
          </div>

          <p style="color:#78909c;font-size:11px;margin-top:20px;border-top:1px solid #e0e0e0;padding-top:12px;">
            This report was generated automatically. Do not reply to this email.
            For disputes, contact the institution directly.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:14px 20px;border-top:1px solid #e0e0e0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">
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


async def send_submission_acknowledgment_email(
    hr_email: str,
    company_name: str,
    request_id: str,
    candidate_name: str,
    register_number: str,
) -> None:
    """
    Dispatch an automated confirmation email to the requester when their
    verification request transitions to PENDING_ADMIN_REVIEW.
    """
    try:
        if settings.DEV_MOCK_OTP:
            logger.warning(
                "[DEV-ONLY] Submission acknowledgment email simulated for %s (%s). Request ID: %s",
                _mask_email(hr_email),
                company_name,
                request_id,
            )
            return

        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        subject = f"[SIET Academic Verification] Request Acknowledgment - {request_id}"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = hr_email

        html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Request Acknowledgment</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);">
    <!-- Header -->
    <div style="background:#064e3b;padding:20px 28px;color:#fff;">
      <h2 style="margin:0;font-size:17px;font-weight:700;">
        SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY
      </h2>
      <p style="margin:4px 0 0;color:#a7f3d0;font-size:12px;">
        Office of Academic Records &amp; Controller of Examinations
      </p>
    </div>
    <!-- Body -->
    <div style="padding:24px 28px;color:#334155;line-height:1.5;">
      <p style="margin-top:0;">Dear Requester,</p>
      <p>Your academic background verification request has been successfully submitted and queued for institutional ledger review.</p>
      
      <div style="background: #f4fbf7; border-left: 4px solid #0B6A3E; padding: 14px 18px; margin: 18px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 5px 0;"><strong>Tracking Number:</strong> <span style="font-family:monospace; color:#064e3b; font-size:14px; font-weight:bold;">{request_id}</span></p>
        <p style="margin: 5px 0;"><strong>Candidate Name:</strong> {candidate_name}</p>
        <p style="margin: 5px 0;"><strong>Register Number:</strong> {register_number}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> Under Review (Office of Academic Records)</p>
        <p style="margin: 5px 0;"><strong>Estimated Turnaround:</strong> 2–5 business days</p>
      </div>

      <p>You can monitor the live verification progress at any time using your tracking code:</p>
      
      <div style="margin: 20px 0;">
        <a href="http://localhost:5173/status?tracking_id={request_id}" style="background: #0B6A3E; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 14px;">Track Verification Status &rarr;</a>
      </div>

      <p style="font-size:12px;color:#64748b;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:14px;">
        For questions or expedited inquiries, contact the Academic Records team at <a href="mailto:verification@siet.ac.in" style="color:#0B6A3E;">verification@siet.ac.in</a> quoting tracking reference <strong>{request_id}</strong>.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:12px 28px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">
        &copy; Sri Shakthi Institute of Engineering and Technology &bull; Coimbatore, Tamil Nadu
      </p>
    </div>
  </div>
</body>
</html>"""

        msg.attach(MIMEText(html_body, "html"))

        logger.info(
            "[SMTP] Connecting to %s:%s to dispatch submission acknowledgment to %s (request: %s) ...",
            settings.SMTP_HOST, settings.SMTP_PORT, _mask_email(hr_email), request_id,
        )
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("[SMTP] Submission acknowledgment email successfully delivered to %s for %s", _mask_email(hr_email), request_id)
    except Exception as exc:
        logger.error(
            "Failed to send submission acknowledgment email to %s for %s: %s",
            _mask_email(hr_email), request_id, exc,
        )
