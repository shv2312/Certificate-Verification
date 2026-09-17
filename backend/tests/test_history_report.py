import pytest

from app.services.email_service import outbox

@pytest.fixture
def auth_headers_hr(client):
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr@test.com", "hr_name": "Test HR", "hr_phone": "+919876543210"
    })
    challenge_id = response.json()["data"]["challenge_id"]
    otp = outbox[-1][2]
    
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    token = response.json()["data"]["session_token"]
    return {"Authorization": f"Bearer {token}"}

def test_get_history_unauthenticated(client):
    response = client.get("/api/v1/verification/history")
    assert response.status_code == 401

def test_get_history_authenticated_empty(client, auth_headers_hr):
    response = client.get(
        "/api/v1/verification/history",
        headers=auth_headers_hr
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["requests"] == []

def test_get_report_unauthenticated(client):
    response = client.get("/api/v1/verification/invalid-id/report")
    assert response.status_code == 401

def test_get_report_not_found(client, auth_headers_hr):
    response = client.get(
        "/api/v1/verification/invalid-id/report",
        headers=auth_headers_hr
    )
    assert response.status_code == 409
