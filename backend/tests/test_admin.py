import pytest

pytestmark = pytest.mark.asyncio

async def test_admin_requests_forbidden_for_hr(client):
    # Send OTP for HR
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr@test.com"
    })
    challenge_id = response.json()["data"]["challenge_id"]
    otp = response.json()["data"]["dev_otp"]
    
    # Verify OTP
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    token = response.json()["data"]["session_token"]
    
    # Try to access Admin route
    response = client.get("/api/v1/admin/requests", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

async def test_admin_requests_allowed_for_admin(client, db_session):
    # Mock an admin token by inserting into the DB. 
    # Or just use the email "admin@siet.ac.in" if it's seeded.
    # We will insert an admin account.
    from app.db.models import AdminAccount
    from datetime import datetime, timezone
    
    admin_acc = AdminAccount(email="admin@test.com", created_at=datetime.now(timezone.utc))
    db_session.add(admin_acc)
    await db_session.commit()
    
    # Send OTP for Admin
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "SIET Admin",
        "hr_email": "admin@test.com"
    })
    challenge_id = response.json()["data"]["challenge_id"]
    otp = response.json()["data"]["dev_otp"]
    
    # Verify OTP
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    token = response.json()["data"]["session_token"]
    
    # Access Admin route
    response = client.get("/api/v1/admin/requests", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["success"] is True
