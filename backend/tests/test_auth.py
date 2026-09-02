import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_auth_me_returns_401_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

async def test_auth_me_returns_user_info(client):
    # Send OTP
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr@test.com"
    })
    assert response.status_code == 200
    challenge_id = response.json()["data"]["challenge_id"]
    otp = response.json()["data"]["dev_otp"]
    
    # Verify OTP
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    assert response.status_code == 200
    token = response.json()["data"]["session_token"]
    
    # Get Me
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["data"]["company_name"] == "Test Company"
    assert response.json()["data"]["hr_email"] == "hr@test.com"
    assert response.json()["data"]["role"] == "HR"
