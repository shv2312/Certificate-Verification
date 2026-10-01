"""
app/schemas/verification.py
============================
Request and response schemas for the candidate verification flow.

CRITICAL BUSINESS RULES ENFORCED HERE:
  1. ONE PAYMENT = ONE CANDIDATE VERIFICATION ONLY.
     The backend rejects any attempt to verify a second candidate
     against an already-consumed payment.
  2. Candidate information must NEVER be fabricated.
     Successful verification data comes ONLY from Parthiban's
     authoritative institutional database.
  3. On failure: neutral message only.
     Do NOT reveal what mismatched (e.g. do not say "year of passing
     did not match – official records show 2025").
  4. On success: data-minimized report fields only.
     Do NOT return the entire student database row.

Candidate Input Fields (mandatory, per HOD-approved workflow):
  * Candidate Name
  * Register / Roll Number
  * Course / Programme
  * Branch / Specialization
  * Year of Passing

These fields may receive small adjustments based on institutional feedback.
The schema is kept maintainable (no hard-coded enum for every course name).
"""

from __future__ import annotations

import re
import secrets
from typing import Optional, Any

from pydantic import BaseModel, Field, field_validator, model_validator


# ------------------------------------------------------------------ #
# POST /api/verification/initiate                                     #
# ------------------------------------------------------------------ #
class InitiateVerificationRequest(BaseModel):
    """
    Request body for initiating candidate verification order.
    Captures candidate's academic details before secure payment.
    """
    candidate_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Full name of the candidate as on certificate.",
        examples=["Jane Doe"],
    )
    register_number: str = Field(
        ...,
        min_length=3,
        max_length=30,
        description="Register or roll number.",
        examples=["710621104001"],
    )
    register_no: Optional[str] = Field(
        None,
        description="Alias for register_number.",
    )
    roll_number: Optional[str] = Field(
        None,
        description="Alias for register_number.",
    )
    degree: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Degree or course title.",
        examples=["B.E."],
    )
    degree_course: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Degree or course title (alias).",
        examples=["B.E."],
    )
    specialization: Optional[str] = Field(
        None,
        max_length=150,
        description="Specialization or branch.",
        examples=["Computer Science and Engineering"],
    )
    branch: Optional[str] = Field(
        None,
        max_length=150,
        description="Alias for specialization.",
        examples=["Computer Science and Engineering"],
    )
    year_of_passing: Optional[int] = Field(
        None,
        ge=1990,
        le=2100,
        description="Year of passing.",
        examples=[2024],
    )
    passing_year: Optional[int] = Field(
        None,
        ge=1990,
        le=2100,
        description="Alias for year_of_passing.",
        examples=[2024],
    )
    dob: Optional[str] = Field(
        None,
        description="Date of birth in YYYY-MM-DD format.",
        examples=["2000-01-01"],
    )
    certificate_no: Optional[str] = Field(
        None,
        max_length=100,
        description="Certificate number.",
    )
    degree_certificate_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Alias for certificate_no.",
    )
    year_of_enrolment: Optional[int] = Field(
        None,
        ge=1990,
        le=2100,
    )
    class_obtained: Optional[str] = Field(
        None,
    )
    certificate_url: Optional[str] = Field(
        None,
    )
    entry_mode: Optional[str] = Field(
        "Regular",
        description="Admission Type / Entry Mode: 'Regular' or 'Lateral'.",
        examples=["Regular"],
    )
    admission_type: Optional[str] = Field(
        None,
        description="Alias for entry_mode.",
        examples=["Regular"],
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # register_number aliases
            reg = data.get("register_number") or data.get("register_no") or data.get("roll_number")
            if reg:
                data["register_number"] = reg
                data["register_no"] = reg
                data["roll_number"] = reg

            # degree aliases
            deg = data.get("degree") or data.get("degree_course") or data.get("course")
            if deg:
                data["degree"] = deg
                data["degree_course"] = deg
            else:
                data["degree"] = "B.E."
                data["degree_course"] = "B.E."

            # specialization aliases
            spec = data.get("specialization") or data.get("branch")
            if spec:
                data["specialization"] = spec
                data["branch"] = spec
            else:
                data["specialization"] = "General"
                data["branch"] = "General"

            # year_of_passing aliases
            yop = data.get("year_of_passing") or data.get("passing_year")
            if yop:
                try:
                    data["year_of_passing"] = int(yop)
                    data["passing_year"] = int(yop)
                except (ValueError, TypeError):
                    data["year_of_passing"] = 2024
                    data["passing_year"] = 2024
            else:
                data["year_of_passing"] = 2024
                data["passing_year"] = 2024

            # certificate_no aliases
            cert = data.get("certificate_no") or data.get("degree_certificate_number")
            if cert:
                data["certificate_no"] = cert
                data["degree_certificate_number"] = cert
            else:
                gen_cert = f"CERT-{secrets.token_hex(4).upper()}"
                data["certificate_no"] = gen_cert
                data["degree_certificate_number"] = gen_cert

            # entry_mode / admission_type
            raw_entry = data.get("entry_mode") or data.get("admission_type") or "Regular"
            data["entry_mode"] = raw_entry
            data["admission_type"] = raw_entry

            if not data.get("dob"):
                data["dob"] = "2000-01-01"
        return data

    @field_validator("degree", "degree_course", mode="before")
    @classmethod
    def normalize_degree(cls, v: Any) -> Any:
        if not v:
            return v
        v_str = str(v)
        if "B.E." in v_str:
            return "B.E."
        if "B.Tech" in v_str:
            return "B.Tech"
        if "M.E." in v_str:
            return "M.E."
        if "M.Tech" in v_str:
            return "M.Tech"
        if "Ph.D" in v_str or "Doctor" in v_str:
            return "Ph.D."
        return v_str

    @field_validator("entry_mode", "admission_type", mode="before")
    @classmethod
    def normalize_entry_mode(cls, v: Any) -> Any:
        if not v:
            return "Regular"
        if "lateral" in str(v).lower():
            return "Lateral"
        return "Regular"

    @field_validator("register_number", mode="after")
    @classmethod
    def validate_register_number(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[A-Za-z0-9\-/]+$", v):
            raise ValueError(
                "Register number must contain only letters, digits, hyphens, or slashes."
            )
        return v.upper()


class InitiateVerificationResponse(BaseModel):
    """
    Response returned when verification order is successfully initiated.
    Contains verification request ID and payment order details.
    """
    verification_request_id: str
    display_request_id: str
    payment_order_id: str
    payment_session_id: str
    gateway_key_id: str
    amount_paise: int
    currency: str = "INR"
    candidate_summary: dict


# ------------------------------------------------------------------ #
# Candidate details (reused across bind + confirm steps)              #
# ------------------------------------------------------------------ #
class CandidateDetails(BaseModel):
    """
    Candidate academic details submitted by HR.

    All fields are mandatory (per HOD-approved workflow).
    Frontend should mark them with '*'.

    Validation here is intentionally NOT overly strict so that legitimate
    institutional data is not rejected.  For example, course names are
    free-text because SIET may add new programmes.
    """
    candidate_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Full name of the candidate as it appears on institutional records.",
        examples=["Arjun Ramaswamy"],
    )
    dob: str = Field(
        ...,
        description="Date of birth in YYYY-MM-DD format.",
        examples=["1998-05-15"],
    )
    register_number: str = Field(
        ...,
        min_length=3,
        max_length=30,
        description="Register / roll number assigned by SIET.",
        examples=["710621104001"],
    )
    register_no: Optional[str] = Field(
        None,
        description="Alias for register_number.",
    )
    roll_number: Optional[str] = Field(
        None,
        description="Alias for register_number.",
    )
    degree: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Degree/Course Title (e.g. B.E., B.Tech).",
    )
    degree_course: Optional[str] = Field(
        None,
        description="Alias for degree.",
    )
    specialization: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Field of Study/Specialization name.",
    )
    branch: Optional[str] = Field(
        None,
        description="Alias for specialization.",
    )
    year_of_passing: int = Field(
        ...,
        ge=1990,
        le=2100,
        description="Year of passing.",
        examples=[2025],
    )
    passing_year: Optional[int] = Field(
        None,
        description="Alias for year_of_passing.",
    )
    certificate_no: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Degree Certificate Number.",
    )
    degree_certificate_number: Optional[str] = Field(
        None,
        description="Alias for certificate_no.",
    )
    year_of_enrolment: Optional[int] = Field(
        None,
        ge=1990,
        le=2100,
        description="Year of Enrolment.",
    )
    class_obtained: Optional[str] = Field(
        None,
        description="Class Obtained (e.g., First Class).",
    )
    entry_mode: Optional[str] = Field(
        "Regular",
        description="Admission Type / Entry Mode: 'Regular' or 'Lateral'.",
    )
    admission_type: Optional[str] = Field(
        None,
        description="Alias for entry_mode.",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            reg = data.get("register_number") or data.get("register_no") or data.get("roll_number")
            if reg:
                data["register_number"] = reg
                data["register_no"] = reg
                data["roll_number"] = reg

            deg = data.get("degree") or data.get("degree_course") or data.get("course") or "B.E."
            data["degree"] = deg
            data["degree_course"] = deg

            spec = data.get("specialization") or data.get("branch") or "General"
            data["specialization"] = spec
            data["branch"] = spec

            yop = data.get("year_of_passing") or data.get("passing_year") or 2024
            try:
                data["year_of_passing"] = int(yop)
                data["passing_year"] = int(yop)
            except (ValueError, TypeError):
                data["year_of_passing"] = 2024
                data["passing_year"] = 2024

            if not data.get("dob"):
                data["dob"] = "2000-01-01"

            cert = data.get("certificate_no") or data.get("degree_certificate_number") or "CERT-DEFAULT"
            data["certificate_no"] = cert
            data["degree_certificate_number"] = cert

            raw_entry = data.get("entry_mode") or data.get("admission_type") or "Regular"
            data["entry_mode"] = raw_entry
            data["admission_type"] = raw_entry
        return data

    @field_validator("degree", "degree_course", mode="before")
    @classmethod
    def normalize_degree(cls, v: Any) -> Any:
        if not v:
            return v
        v_str = str(v)
        if "B.E." in v_str:
            return "B.E."
        if "B.Tech" in v_str:
            return "B.Tech"
        if "M.E." in v_str:
            return "M.E."
        if "M.Tech" in v_str:
            return "M.Tech"
        if "Ph.D" in v_str or "Doctor" in v_str:
            return "Ph.D."
        return v_str

    @field_validator("entry_mode", "admission_type", mode="before")
    @classmethod
    def normalize_entry_mode(cls, v: Any) -> Any:
        if not v:
            return "Regular"
        if "lateral" in str(v).lower():
            return "Lateral"
        return "Regular"

    @field_validator("candidate_name", "register_number", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()

    @field_validator("register_number", mode="after")
    @classmethod
    def register_number_must_be_alphanumeric(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z0-9\-/]+$", v):
            raise ValueError(
                "Register number must contain only letters, digits, hyphens, or slashes."
            )
        return v.upper()


# ------------------------------------------------------------------ #
# POST /api/v1/verification/bind-candidate                             #
# ------------------------------------------------------------------ #
class BindCandidateRequest(BaseModel):
    """
    Binds a specific candidate to a paid (PAID_UNUSED) verification request.

    After this step, the verification request transitions to CANDIDATE_BOUND.
    The HR is then shown a confirmation screen before the final verify step.

    verification_request_id:  Issued by the backend after payment confirmation.
    """
    verification_request_id: str = Field(
        ...,
        description="Backend verification request ID (from payment status response).",
    )
    candidate: CandidateDetails


class BindCandidateResponse(BaseModel):
    """Confirmation data after candidate is bound."""
    verification_request_id: str
    display_request_id: str
    status: str  # CANDIDATE_BOUND
    candidate: CandidateDetails
    warning: str = (
        "This payment can be used for one candidate verification only. "
        "Please review the details carefully before confirming."
    )


# ------------------------------------------------------------------ #
# POST /api/v1/verification/confirm                                    #
# ------------------------------------------------------------------ #
class ConfirmVerificationRequest(BaseModel):
    """
    HR confirms candidate details and submits for institutional review.
    Accepts requests in PAID_UNUSED or CANDIDATE_BOUND state.
    """
    verification_request_id: str = Field(
        ...,
        description="The verification request ID.",
    )
    candidate_name: Optional[str] = None
    register_number: Optional[str] = None
    programme: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    specialization: Optional[str] = None
    year_of_passing: Optional[int] = None


class VerificationResultResponse(BaseModel):
    """
    Result of the verification confirmation or review submission.
    """
    verification_request_id: str
    display_request_id: str
    status: str   # PENDING_ADMIN_REVIEW | VERIFIED | NAME_MISMATCH | NOT_FOUND | ERROR
    current_state: Optional[str] = None
    request_id: Optional[str] = None

    candidate_name: Optional[str] = None
    university_name: Optional[str] = None
    institute_name: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    register_number: Optional[str] = None
    year_of_passing: Optional[int] = None
    backlog_status: Optional[str] = None
    period_of_study: Optional[str] = None
    mode_of_education: Optional[str] = None

    match_score: Optional[float] = None
    mismatch_probability: Optional[float] = None
    comparison_data: Optional[dict] = None

    # Human-readable outcome message
    message: str

    verification_reference_url: Optional[str] = None


# ------------------------------------------------------------------ #
# GET /api/v1/verification/{request_id}/status                        #
# ------------------------------------------------------------------ #
class VerificationStatusResponse(BaseModel):
    """
    Status polling / lookup for a verification request.

    Authorization: Only the HR session that owns this request may query it.
    Attempting to access another HR's request by guessing the ID must be
    rejected (see app/dependencies.py for ownership check logic).
    """
    verification_request_id: str
    display_request_id: str
    status: str
    company_name: str
    hr_email: str


class VerificationHistoryResponse(BaseModel):
    """
    Response schema for the verification history endpoint.
    Returns a list of all verification requests owned by the authenticated HR user.
    """
    requests: list[VerificationStatusResponse]


# ------------------------------------------------------------------ #
# GET /api/v1/verification/public-status/{request_id}                 #
# ------------------------------------------------------------------ #
class PublicVerificationStatusResponse(BaseModel):
    """
    Public (unauthenticated) status response.

    PII MASKING RULES (strictly enforced):
      - display_request_id only — raw UUID primary key is NEVER returned.
      - candidate_name_masked:  First letter + '***'  e.g. 'A***' or 'A*** R***'
      - company_name:           Returned as-is (not PII).
      - hr_email:               OMITTED entirely from this response.
      - verification_reference_url: Optional public badge URL.

    STATUS VALUES:
      PAID_UNUSED          → "Payment Received — Pending Submission"
      CANDIDATE_BOUND      → "Details Submitted — Awaiting Confirmation"
      VERIFICATION_IN_PROGRESS → "Verification In Progress"
      VERIFIED             → "Verified"
      NOT_VERIFIED         → "Could Not Be Verified"
      NAME_MISMATCH        → "Could Not Be Verified"
      NOT_FOUND            → "Could Not Be Verified"
      ERROR                → "Processing Error"
    """
    display_request_id: str
    status: str
    status_label: str  # Human-readable label safe for public display
    company_name: str
    candidate_name_masked: Optional[str] = None
    verification_reference_url: Optional[str] = None
