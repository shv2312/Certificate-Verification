import pytest
from app.services.email_service import _build_report_html

def test_build_report_html_responsive_table():
    report_data = {
        "status": "VERIFIED",
        "candidate_name": "Arjun Kumar",
        "course": "B.E. Computer Science",
        "branch": "Computer Science and Engineering",
        "register_number": "710621104001",
        "year_of_passing": "2024",
        "backlog_status": "No Backlogs",
        "period_of_study": "2020 - 2024",
        "entry_mode": "Regular",
    }
    company = "Infosys Ltd & Co."
    html_output = _build_report_html(report_data, company)

    # Validate responsive container
    assert '<div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box;">' in html_output

    # Validate fixed layout table with word break
    assert '<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; margin-top: 15px; word-break: break-word;">' in html_output

    # Validate thead column headers and widths
    assert '<th style="width: 26%; text-align: left; padding: 8px 4px; font-size: 11px; color: #475569; text-transform: uppercase;">Details</th>' in html_output
    assert '<th style="width: 38%; text-align: left; padding: 8px 4px; font-size: 11px; color: #475569; text-transform: uppercase;">Candidate\'s Input</th>' in html_output
    assert '<th style="width: 12%; text-align: center; padding: 8px 2px; font-size: 11px; color: #475569; text-transform: uppercase;">Status</th>' in html_output
    assert '<th style="width: 24%; text-align: center; padding: 8px 2px; font-size: 11px; color: #475569; text-transform: uppercase;">Comments</th>' in html_output

    # Validate row formatting
    assert 'Arjun Kumar' in html_output
    assert '710621104001' in html_output
    assert 'Infosys Ltd &amp; Co.' in html_output
    assert "Verifier's Remarks" in html_output
