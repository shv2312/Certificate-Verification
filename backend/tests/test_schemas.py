"""
tests/test_schemas.py
======================
Tests for request/response schema validation.

Verifies that:
  - Valid inputs pass validation
  - Invalid inputs are rejected with clear errors
  - Security-sensitive fields behave as designed

Sprint 1 checklist:
  [x] Schema validation for email verification inputs
  [x] Schema validation for candidate details
  [x] OTP format enforcement (6 digits only)
  [x] Year of passing range enforcement
  [x] Register number alphanumeric enforcement
"""

import pytest
from pydantic import ValidationError

from app.schemas.email_verification import SendOTPRequest, VerifyOTPRequest
from app.schemas.verification import CandidateDetails


# ------------------------------------------------------------------ #
# SendOTPRequest                                                        #
# ------------------------------------------------------------------ #
class TestSendOTPRequestSchema:

    def test_valid_request(self) -> None:
        req = SendOTPRequest(
            company_name="Acme Technologies Pvt. Ltd.",
            hr_email="hr@acmetechnologies.com",
        )
        assert req.company_name == "Acme Technologies Pvt. Ltd."
        assert str(req.hr_email) == "hr@acmetechnologies.com"

    def test_company_name_stripped(self) -> None:
        req = SendOTPRequest(
            company_name="  Acme Corp  ",
            hr_email="hr@acme.com",
        )
        assert req.company_name == "Acme Corp"

    def test_company_name_too_short_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendOTPRequest(company_name="A", hr_email="hr@acme.com")

    def test_invalid_email_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendOTPRequest(company_name="Acme Corp", hr_email="not-an-email")

    def test_empty_company_name_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SendOTPRequest(company_name="", hr_email="hr@acme.com")


# ------------------------------------------------------------------ #
# VerifyOTPRequest                                                      #
# ------------------------------------------------------------------ #
class TestVerifyOTPRequestSchema:

    def test_valid_otp(self) -> None:
        req = VerifyOTPRequest(challenge_id="a" * 10, otp="123456")
        assert req.otp == "123456"

    def test_otp_must_be_6_digits(self) -> None:
        with pytest.raises(ValidationError):
            VerifyOTPRequest(challenge_id="a" * 10, otp="12345")  # too short

    def test_otp_too_long_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VerifyOTPRequest(challenge_id="a" * 10, otp="1234567")  # too long

    def test_otp_letters_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VerifyOTPRequest(challenge_id="a" * 10, otp="12345A")  # not digits

    def test_challenge_id_too_short_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VerifyOTPRequest(challenge_id="short", otp="123456")


# ------------------------------------------------------------------ #
# CandidateDetails                                                      #
# ------------------------------------------------------------------ #
class TestCandidateDetailsSchema:

    def _valid_candidate(self, **overrides) -> dict:
        base = {
            "candidate_name": "Arjun Ramaswamy",
            "register_number": "710621104001",
            "course": "B.E.",
            "branch": "Computer Science and Engineering",
            "year_of_passing": 2024,
        }
        base.update(overrides)
        return base

    def test_valid_candidate(self) -> None:
        c = CandidateDetails(**self._valid_candidate())
        assert c.candidate_name == "Arjun Ramaswamy"
        assert c.register_number == "710621104001"

    def test_register_number_normalized_to_uppercase(self) -> None:
        c = CandidateDetails(**self._valid_candidate(register_number="abc123"))
        assert c.register_number == "ABC123"

    def test_register_number_special_chars_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CandidateDetails(**self._valid_candidate(register_number="ABC@123!"))

    def test_year_too_old_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CandidateDetails(**self._valid_candidate(year_of_passing=1989))

    def test_year_too_future_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CandidateDetails(**self._valid_candidate(year_of_passing=2101))

    def test_candidate_name_stripped(self) -> None:
        c = CandidateDetails(**self._valid_candidate(candidate_name="  Arjun  "))
        assert c.candidate_name == "Arjun"

    def test_missing_mandatory_field_rejected(self) -> None:
        data = self._valid_candidate()
        del data["register_number"]
        with pytest.raises(ValidationError):
            CandidateDetails(**data)
