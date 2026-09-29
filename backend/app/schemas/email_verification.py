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
from typing import Optional, Any
import phonenumbers

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


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
    organization_type: Optional[str] = Field(
        None,
        description="Type of the organization (e.g., Private, Government).",
    )
    organization_name: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Legal/registered name of the requesting organization.",
        examples=["Acme Technologies Pvt. Ltd."],
    )
    requester_email: EmailStr = Field(
        ...,
        description="Official email address that will receive the OTP.",
        examples=["hr@acmetechnologies.com"],
    )
    requester_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Full name of the requester.",
        examples=["John Doe"],
    )
    requester_role: Optional[str] = Field(
        None,
        max_length=150,
        description="Role or designation of the requester.",
        examples=["HR Manager"],
    )
    requester_phone: str = Field(
        ...,
        description="Contact phone number of the requester.",
        examples=["+919876543210"],
    )

    @model_validator(mode="before")
    @classmethod
    def populate_aliases_and_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Email mapping
            if "requester_email" not in data or not data.get("requester_email"):
                if "email" in data:
                    data["requester_email"] = data["email"]
                elif "hr_email" in data:
                    data["requester_email"] = data["hr_email"]

            # Organization name mapping
            if "organization_name" not in data or not data.get("organization_name"):
                if "company_name" in data:
                    data["organization_name"] = data["company_name"]
                elif "org_name" in data:
                    data["organization_name"] = data["org_name"]
                elif data.get("requester_email"):
                    domain = str(data["requester_email"]).split("@")[-1].split(".")[0].capitalize()
                    data["organization_name"] = f"{domain} Organization"

            # Requester name mapping
            if "requester_name" not in data or not data.get("requester_name"):
                if "hr_name" in data:
                    data["requester_name"] = data["hr_name"]
                elif "name" in data:
                    data["requester_name"] = data["name"]
                elif data.get("requester_email"):
                    data["requester_name"] = str(data["requester_email"]).split("@")[0].capitalize()

            # Phone mapping
            if "requester_phone" not in data or not data.get("requester_phone"):
                if "hr_phone" in data:
                    data["requester_phone"] = data["hr_phone"]
                elif "phone" in data:
                    data["requester_phone"] = data["phone"]
                else:
                    data["requester_phone"] = "+919876543210"
        return data

    @field_validator("organization_name", "requester_name", mode="before")
    @classmethod
    def clean_text_fields(cls, v: str) -> str:
        return _clean_text(v)

    @field_validator("requester_phone", mode="before")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Strip non-numeric characters except '+'
        v = re.sub(r'[^\d+]', '', v)
        try:
            # Default to IN (+91) if no country code provided
            parsed = phonenumbers.parse(v, "IN")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number format.")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValueError("Invalid phone number format.")

    @property
    def company_name(self) -> str:
        return self.organization_name

    @property
    def hr_email(self) -> str:
        return str(self.requester_email)

    @property
    def hr_name(self) -> str:
        return self.requester_name

    @property
    def hr_phone(self) -> str:
        return self.requester_phone


class SendOTPResponse(BaseModel):
    """Response data when OTP has been dispatched."""
    # Opaque identifier for the challenge – the frontend must send this
    # back in the verify-otp request alongside the OTP.
    challenge_id: str
    # Return the masked email so the frontend can display:
    # "OTP sent to hr***@acme.com"
    masked_email: str
    resend_allowed_after_seconds: int
    # Included only during DEV_MOCK_OTP=true for development/testing convenience
    dev_otp: Optional[str] = None


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
    email: Optional[EmailStr] = Field(
        None,
        description="Optional email address associated with the verification challenge.",
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
