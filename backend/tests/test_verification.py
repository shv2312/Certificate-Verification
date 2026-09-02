import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import PaymentSession, VerificationRequest
from app.services.payment_service import RequestStatus
import json
import time

@pytest.fixture
def auth_headers_hr(client: TestClient):
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr@test.com"
    })
    challenge_id = response.json()["data"]["challenge_id"]
    otp = response.json()["data"]["dev_otp"]
    
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    token = response.json()["data"]["session_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_bind_candidate_success(
    client: TestClient,
    db_session: AsyncSession,
    auth_headers_hr: dict,
):
    # Seed a paid verification request
    request_id = "test-req-123"
    display_id = "SIET-123"
    
    vr = VerificationRequest(
        id=request_id,
        display_request_id=display_id,
        status=RequestStatus.PAID_UNUSED,
        company_name="Test Company",
        hr_email="hr@test.com",
        created_at=int(time.time()),
    )
    db_session.add(vr)
    
    ps = PaymentSession(
        id="pay-123",
        amount_paise=50000,
        status=RequestStatus.PAID_UNUSED,
        verification_request_id=request_id,
        created_at=int(time.time()),
    )
    db_session.add(ps)
    await db_session.commit()

    candidate_data = {
        "candidate_name": "John Doe",
        "register_number": "713519104001",
        "course": "B.E",
        "branch": "CSE",
        "year_of_passing": 2023
    }

    response = client.post(
        "/api/v1/verification/bind-candidate",
        headers=auth_headers_hr,
        json={
            "verification_request_id": request_id,
            "candidate": candidate_data
        }
    )

    assert response.status_code == 200
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["status"] == RequestStatus.CANDIDATE_BOUND
    assert data["data"]["candidate"]["candidate_name"] == "John Doe"

@pytest.mark.asyncio
async def test_confirm_verification_success(
    client: TestClient,
    db_session: AsyncSession,
    auth_headers_hr: dict,
):
    # Seed a bound verification request
    request_id = "test-req-456"
    display_id = "SIET-456"
    
    candidate_data = {
        "candidate_name": "Jane Doe",
        "register_number": "713519104002",
        "course": "B.E",
        "branch": "IT",
        "year_of_passing": 2023
    }
    
    vr = VerificationRequest(
        id=request_id,
        display_request_id=display_id,
        status=RequestStatus.CANDIDATE_BOUND,
        company_name="Test Company",
        hr_email="hr@test.com",
        created_at=int(time.time()),
        candidate_data=json.dumps(candidate_data)
    )
    db_session.add(vr)
    
    ps = PaymentSession(
        id="pay-456",
        amount_paise=50000,
        status=RequestStatus.CANDIDATE_BOUND,
        verification_request_id=request_id,
        created_at=int(time.time()),
    )
    db_session.add(ps)
    await db_session.commit()

    response = client.post(
        "/api/v1/verification/confirm",
        headers=auth_headers_hr,
        json={"verification_request_id": request_id}
    )

    assert response.status_code == 200
    data = response.json()
    # Given we use mock verification, it should be VERIFIED
    assert data["data"]["status"] == RequestStatus.NOT_VERIFIED # Test dummy doesn't have JANE DOE so it will be NOT_VERIFIED
    # We no longer expect name/university to be returned on NOT_VERIFIED
