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
import phonenumbers

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
    hr_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Full name of the HR representative.",
        examples=["John Doe"],
    )
    hr_phone: str = Field(
        ...,
        description="Contact phone number of the HR representative.",
        examples=["+919876543210"],
    )

    @field_validator("company_name", "hr_name", mode="before")
    @classmethod
    def clean_text_fields(cls, v: str) -> str:
        return _clean_text(v)

    @field_validator("hr_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        try:
            # Default to IN (+91) if no country code provided
            parsed = phonenumbers.parse(v, "IN")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number format.")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValueError("Invalid phone number format.")


class SendOTPResponse(BaseModel):
    """Response data when OTP has been dispatched."""
    # Opaque identifier for the challenge – the frontend must send this
    # back in the verify-otp request alongside the OTP.
    challenge_id: str
    # Return the masked email so the frontend can display:
    # "OTP sent to hr***@acme.com"
    masked_email: str
    resend_allowed_after_seconds: int


# ------------------------------------------------------------------ #
# POST /api/v1/email/resend-otp                                        #
# ------------------------------------------------------------------ #
class ResendOTPRequest(BaseModel):
    """
    Request body for resending (refreshing) the email verification OTP.

    The frontend keeps the challenge_id from the original send-otp response.
    Sending it here allows the backend to look up the original email and
    company without requiring the HR to re-enter their details.
    """
    challenge_id: str = Field(
        ...,
        min_length=10,
        max_length=128,
        description="Opaque challenge identifier from the original send-otp response.",
    )


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
    role: str
