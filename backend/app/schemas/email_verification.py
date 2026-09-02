"""
app/schemas/email_verification.py
==================================
Request and response schemas for the HR email verification flow.

Flow:
    1. HR submits company details + email → POST /api/v1/email/send-otp
    2. Backend sends OTP to the submitted email address
    3. HR submits the OTP   → POST /api/v1/email/verify-otp
    4. On success, a session token is issued that gates payment access

All fields validated server-side regardless of frontend validation.
"""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ------------------------------------------------------------------ #
# Input validators (shared)                                            #
# ------------------------------------------------------------------ #
def _clean_text(v: str) -> str:
    """Strip whitespace from both ends."""
    return v.strip()


# ------------------------------------------------------------------ #
# POST /api/v1/email/send-otp                                          #
# ------------------------------------------------------------------ #
class SendOTPRequest(BaseModel):
    """
    Request body for sending the email verification OTP.

    company_name:   Legal/registered name of the requesting company.
    hr_email:       Official HR email address.  Must be a valid RFC-5321
                    address.  Personal email domains (gmail, yahoo, etc.)
                    are NOT blocked here because small companies legitimately
                    use them; domain restriction is a business policy
                    decision to be confirmed with SIET management.
    """
    company_name: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Legal/registered name of the requesting company.",
        examples=["Acme Technologies Pvt. Ltd."],
    )
    hr_email: EmailStr = Field(
        ...,
        description="Official HR email address that will receive the OTP.",
        examples=["hr@acmetechnologies.com"],
    )

    @field_validator("company_name", mode="before")
    @classmethod
    def clean_company_name(cls, v: str) -> str:
        return _clean_text(v)


class SendOTPResponse(BaseModel):
    """Response data when OTP has been dispatched."""
    # Opaque identifier for the challenge – the frontend must send this
    # back in the verify-otp request alongside the OTP.
    challenge_id: str
    # Return the masked email so the frontend can display:
    # "OTP sent to hr***@acme.com"
    masked_email: str
    resend_allowed_after_seconds: int
    # In DEV_MOCK_OTP mode, the OTP is returned here so developers
    # can test without a real inbox.  NEVER populate this in production.
    dev_otp: Optional[str] = None


# ------------------------------------------------------------------ #
# POST /api/v1/email/verify-otp                                        #
# ------------------------------------------------------------------ #
class VerifyOTPRequest(BaseModel):
    """
    Request body for verifying the OTP submitted by the HR.

    challenge_id:  The opaque challenge reference issued during send-otp.
                   This ties the OTP submission back to the correct challenge
                   without the client needing to re-submit the email address.
    otp:           The 6-digit OTP entered by the HR.
    """
    challenge_id: str = Field(
        ...,
        min_length=10,
        max_length=128,
        description="Opaque challenge identifier from send-otp response.",
    )
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
        description="6-digit OTP received in HR email.",
    )


class VerifyOTPResponse(BaseModel):
    """Response data when OTP is accepted."""
    # Opaque session token granting payment access.
    # Sprint 1: This is a signed token (details in services/email_service.py).
    # The frontend stores this token and sends it as a Bearer header.
    session_token: str
    # Human-readable label for the verified session
    verified_company: str
    verified_email: str
