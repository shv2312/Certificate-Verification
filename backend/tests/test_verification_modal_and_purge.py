import os
import pytest
from app.routes.admin import purge_uploaded_certificate, AuditQueueItem
from app.schemas.verification import CandidateDetails, InitiateVerificationRequest

def test_purge_uploaded_certificate(tmp_path):
    # Create a temporary file pretending to be in uploads
    base_dir = os.path.dirname(os.path.dirname(__file__))
    test_upload_dir = os.path.join(base_dir, "uploads", "certificates")
    os.makedirs(test_upload_dir, exist_ok=True)
    
    test_file_name = "test_candidate_purge_file.pdf"
    test_file_path = os.path.join(test_upload_dir, test_file_name)
    with open(test_file_path, "w") as f:
        f.write("Candidate sensitive certificate data")
        
    assert os.path.exists(test_file_path)
    
    # Execute purge
    purged = purge_uploaded_certificate(f"/uploads/certificates/{test_file_name}")
    assert purged is True
    assert not os.path.exists(test_file_path)

def test_candidate_details_with_admission_type():
    data = {
        "candidate_name": "Kavitha Sundaram",
        "dob": "2001-08-14",
        "register_number": "710621104050",
        "degree": "B.E. (Bachelor of Engineering)",
        "specialization": "Computer Science and Engineering",
        "year_of_passing": 2025,
        "certificate_no": "CERT-SIET-9999",
        "admission_type": "Lateral Entry (Direct 2nd Year)",
    }
    cd = CandidateDetails(**data)
    assert cd.degree == "B.E."
    assert cd.entry_mode == "Lateral"

def test_initiate_verification_request_with_admission_type():
    req = InitiateVerificationRequest(
        candidate_name="Kavitha Sundaram",
        register_number="710621104050",
        degree="B.E. (Bachelor of Engineering)",
        admission_type="Lateral Entry (Direct 2nd Year)",
    )
    assert req.degree == "B.E."
    assert req.entry_mode == "Lateral"

def test_audit_queue_item_entry_mode_fields():
    item = AuditQueueItem(
        id="vr_123",
        display_request_id="SIET-2026-0001",
        company_name="Infosys",
        hr_email="hr@infosys.com",
        status="PENDING_REVIEW",
        admin_decision="PENDING_REVIEW",
        created_at=1727712000,
        similarity_percentage=95,
        similarity_badge_color="green",
        submitted_name="Kavitha Sundaram",
        submitted_register_number="710621104050",
        submitted_programme="B.E. (Bachelor of Engineering)",
        submitted_branch="Computer Science and Engineering",
        submitted_year_of_passing="2025",
        submitted_dob="2001-08-14",
        submitted_entry_mode="Lateral Entry (Direct 2nd Year)",
        db_name="Kavitha Sundaram",
        db_register_number="710621104050",
        db_programme="B.E.",
        db_branch="Computer Science and Engineering",
        db_year_of_passing="2025",
        db_entry_mode="Lateral Entry (Direct 2nd Year)",
        matches={"name": True, "register_number": True, "programme": True, "year_of_passing": True, "dob": True, "entry_mode": True}
    )
    assert item.submitted_entry_mode == "Lateral Entry (Direct 2nd Year)"
    assert item.db_entry_mode == "Lateral Entry (Direct 2nd Year)"
    assert item.matches["entry_mode"] is True

def test_multi_certificate_purge(tmp_path):
    base_dir = os.path.dirname(os.path.dirname(__file__))
    test_upload_dir = os.path.join(base_dir, "uploads", "certificates")
    os.makedirs(test_upload_dir, exist_ok=True)
    
    file1 = "test_multi_1.pdf"
    file2 = "test_multi_2.jpg"
    p1 = os.path.join(test_upload_dir, file1)
    p2 = os.path.join(test_upload_dir, file2)
    with open(p1, "w") as f:
        f.write("doc1")
    with open(p2, "w") as f:
        f.write("doc2")
        
    assert os.path.exists(p1)
    assert os.path.exists(p2)
    
    # Purge multiple comma-separated URLs
    multi_url = f"/uploads/certificates/{file1},/uploads/certificates/{file2}"
    for u in multi_url.split(","):
        purge_uploaded_certificate(u.strip())
        
    assert not os.path.exists(p1)
    assert not os.path.exists(p2)


def test_approve_payload_model():
    from app.routes.admin import ApproveRequestPayload, RejectRequestPayload
    p = ApproveRequestPayload(remarks="All academic credentials verified and matched against autonomous institutional records.")
    assert "All academic credentials verified" in p.remarks
    p_empty = ApproveRequestPayload()
    assert p_empty.remarks is None

    # Test verification_remarks and comments fields
    p_vr = ApproveRequestPayload(verification_remarks="Custom remark via verification_remarks")
    assert p_vr.verification_remarks == "Custom remark via verification_remarks"
    p_c = ApproveRequestPayload(comments="Custom remark via comments")
    assert p_c.comments == "Custom remark via comments"

    # Test RejectRequestPayload
    r = RejectRequestPayload(reason="Discrepancy noted", verification_remarks="Discrepancy noted", comments="Discrepancy noted")
    assert r.reason == "Discrepancy noted"
    assert r.verification_remarks == "Discrepancy noted"
    assert r.comments == "Discrepancy noted"


def test_verifier_remarks_in_pdf_and_email():
    from app.services.pdf_service import generate_verification_pdf
    from app.services.email_service import _build_report_html

    custom_remark = "Degree and branch matched with autonomous records. Special distinction in CSE."
    record_data = {
        "status": "VERIFIED",
        "candidate_name": "Deepak Raj",
        "course": "Bachelor of Engineering",
        "branch": "Computer Science and Engineering",
        "register_number": "710621104088",
        "year_of_passing": "2024",
        "backlog_status": "No Backlogs",
        "period_of_study": "2020 - 2024",
        "entry_mode": "Regular",
        "display_request_id": "SIET-2026-0099",
        "verification_remarks": custom_remark,
    }

    # Generate PDF and ensure it builds cleanly without raising an error
    pdf_buffer = generate_verification_pdf(record_data)
    pdf_bytes = pdf_buffer.getvalue()
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 2000

    # Build Email HTML
    email_html = _build_report_html(record_data, "TechCorp Global")
    assert "Verifier&#x27;s Remarks" in email_html or "Verifier's Remarks" in email_html
    assert custom_remark in email_html
    assert "Comments" in email_html

    # Test rejection report email HTML with denial remark
    denial_remark = "Register number/marksheet details do not match autonomous institutional ledger archives."
    denial_record = {
        "status": "NOT_VERIFIED",
        "verification_remarks": denial_remark,
        "candidate_name": "Deepak Raj",
        "register_number": "710621104088",
    }
    denial_html = _build_report_html(denial_record, "TechCorp Global")
    assert "Verifier&#x27;s Remarks" in denial_html or "Verifier's Remarks" in denial_html
    assert denial_remark in denial_html


