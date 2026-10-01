import io
import pytest
from app.services.pdf_service import generate_verification_pdf
from app.services.pdf_generator import generate_verification_pdf as pdf_gen_func
from app.services.email_service import _build_report_html

def test_generate_verification_pdf_clean_student():
    record_data = {
        "candidate_name": "Arjun Kumar",
        "degree": "Bachelor of Engineering (B.E.)",
        "course": "Bachelor of Engineering",
        "branch": "Computer Science and Engineering",
        "specialization": "Computer Science and Engineering",
        "register_number": "710621104001",
        "year_of_passing": "2024",
        "standing_arrears": 0,
        "backlog_status": "No Backlogs",
        "period_of_study": "2020 - 2024",
        "entry_mode": "Regular",
        "display_request_id": "SIET-2026-0001",
    }
    pdf_buffer = generate_verification_pdf(record_data)
    assert isinstance(pdf_buffer, io.BytesIO)
    pdf_bytes = pdf_buffer.getvalue()
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

def test_generate_verification_pdf_with_arrears():
    record_data = {
        "candidate_name": "Suresh Raina",
        "degree": "Bachelor of Engineering (B.E.)",
        "course": "Bachelor of Engineering",
        "branch": "Mechanical Engineering",
        "register_number": "710621104099",
        "year_of_passing": "2024",
        "standing_arrears": 2,
        "backlog_status": "2 Standing Arrear(s)",
        "period_of_study": "2020 - 2024",
        "entry_mode": "Regular",
        "display_request_id": "SIET-2026-0002",
    }
    pdf_buffer = pdf_gen_func(record_data)
    assert isinstance(pdf_buffer, io.BytesIO)
    pdf_bytes = pdf_buffer.getvalue()
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

def test_email_report_clean_backlog_semantics():
    report_data = {
        "status": "VERIFIED",
        "candidate_name": "Arjun Kumar",
        "course": "B.E. Computer Science",
        "branch": "Computer Science and Engineering",
        "register_number": "710621104001",
        "year_of_passing": "2024",
        "standing_arrears": 0,
        "backlog_status": "No Backlogs",
        "period_of_study": "2020 - 2024",
        "entry_mode": "Regular",
    }
    html = _build_report_html(report_data, "Acme Corp")
    assert "No Standing Arrears" in html
    assert "Verified Clear" in html
    assert "All semesters cleared" in html
