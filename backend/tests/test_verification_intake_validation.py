"""
backend/tests/test_verification_intake_validation.py
=====================================================
Unit tests verifying FastAPI Pydantic validation, multipart form data ingestion,
degree and entry_mode normalization, and schema alignment for candidate verification.
"""

import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient

from app.schemas.verification import InitiateVerificationRequest, CandidateDetails
from app.main import create_app


def test_degree_normalization_shorthand_and_expanded():
    """Verify that both shorthand and expanded display degree titles normalize correctly."""
    degrees = {
        "Bachelor of Engineering (B.E.)": "B.E.",
        "B.E. Computer Science": "B.E.",
        "Bachelor of Technology (B.Tech)": "B.Tech",
        "B.Tech Information Technology": "B.Tech",
        "Master of Engineering (M.E.)": "M.E.",
        "Master of Technology (M.Tech)": "M.Tech",
        "Doctor of Philosophy (Ph.D.)": "Ph.D.",
        "Doctoral Research in Engineering": "Ph.D.",
        "B.E.": "B.E.",
        "B.Tech": "B.Tech",
        "M.E.": "M.E.",
        "M.Tech": "M.Tech",
        "Ph.D.": "Ph.D.",
    }

    for input_deg, expected_code in degrees.items():
        req = InitiateVerificationRequest(
            candidate_name="Arjun Sharma",
            register_number="710621104001",
            degree=input_deg,
        )
        assert req.degree == expected_code, f"Failed for {input_deg}: got {req.degree}"

        cd = CandidateDetails(
            candidate_name="Arjun Sharma",
            dob="2000-01-01",
            register_number="710621104001",
            degree=input_deg,
            specialization="Computer Science and Engineering",
            year_of_passing=2024,
            certificate_no="CERT-12345",
        )
        assert cd.degree == expected_code, f"Failed for CandidateDetails {input_deg}: got {cd.degree}"


def test_entry_mode_normalization_case_insensitive():
    """Verify that entry_mode and admission_type normalize to 'Regular' or 'Lateral'."""
    modes = {
        "Regular Entry (1st Year Admission)": "Regular",
        "regular": "Regular",
        "REGULAR": "Regular",
        "Regular": "Regular",
        "Lateral Entry (Direct 2nd Year)": "Lateral",
        "lateral": "Lateral",
        "LATERAL": "Lateral",
        "Lateral": "Lateral",
        None: "Regular",
    }

    for input_mode, expected in modes.items():
        req = InitiateVerificationRequest(
            candidate_name="Pooja Krishnan",
            register_number="710621104002",
            degree="B.E.",
            entry_mode=input_mode,
        )
        assert req.entry_mode == expected, f"Failed for InitiateVerificationRequest {input_mode}"

        cd = CandidateDetails(
            candidate_name="Pooja Krishnan",
            dob="2000-01-01",
            register_number="710621104002",
            degree="B.E.",
            specialization="Electrical and Electronics Engineering",
            year_of_passing=2024,
            certificate_no="CERT-54321",
            entry_mode=input_mode,
        )
        assert cd.entry_mode == expected, f"Failed for CandidateDetails {input_mode}"


def test_alias_resolution_for_all_candidate_fields():
    """Verify alias mapping for register_no, branch, passing_year, degree_certificate_number."""
    data = {
        "candidate_name": "Siddharth Raman",
        "dob": "1999-12-10",
        "register_no": "710621104099",
        "degree_course": "Bachelor of Engineering (B.E.)",
        "branch": "Mechanical Engineering",
        "passing_year": 2023,
        "degree_certificate_number": "CERT-MECH-8888",
        "entry_mode": "Lateral Entry (Direct 2nd Year)",
    }

    req = InitiateVerificationRequest(**data)
    assert req.register_number == "710621104099"
    assert req.specialization == "Mechanical Engineering"
    assert req.year_of_passing == 2023
    assert req.certificate_no == "CERT-MECH-8888"
    assert req.degree == "B.E."
    assert req.entry_mode == "Lateral"

    cd = CandidateDetails(**data)
    assert cd.register_number == "710621104099"
    assert cd.specialization == "Mechanical Engineering"
    assert cd.year_of_passing == 2023
    assert cd.certificate_no == "CERT-MECH-8888"
    assert cd.degree == "B.E."
    assert cd.entry_mode == "Lateral"


def test_validation_error_handler_response_structure():
    """Verify that HTTP 422 contains detail, body, and details fields."""
    app = create_app()
    client = TestClient(app)

    # Calling an endpoint requiring mandatory fields with an empty payload triggers 422
    res = client.post(
        "/api/v1/admin/login",
        json={"email": "not-an-email"}
    )
    assert res.status_code == 422
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"
    assert "details" in data
    assert "detail" in data
    assert "body" in data
    assert data["message"] == "The submitted data contains validation errors. Please check the fields."
