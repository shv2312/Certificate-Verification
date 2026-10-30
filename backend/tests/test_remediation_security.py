import pytest
from app.rate_limit import RateLimiter, set_bypass_rate_limiting, reset_rate_limiter
from app.revocation import revoke_token, is_token_revoked, reset_revocation_store
from app.dependencies import verify_session_token
from app.config import get_settings
from fastapi import HTTPException
from unittest.mock import Mock
import time

pytestmark = pytest.mark.asyncio

@pytest.mark.asyncio
async def test_rate_limiter_exceeded():
    set_bypass_rate_limiting(False)
    reset_rate_limiter()
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    
    mock_request = Mock()
    mock_request.url.path = "/test/path"
    mock_request.client.host = "192.168.1.100"
    mock_request.headers = {}
    
    # 1st request ok
    await limiter(mock_request)
    # 2nd request ok
    await limiter(mock_request)
    
    # 3rd request should raise 429
    with pytest.raises(HTTPException) as exc:
        await limiter(mock_request)
    assert exc.value.status_code == 429
    assert exc.value.headers.get("Retry-After") is not None
    set_bypass_rate_limiting(True)


@pytest.mark.asyncio
async def test_token_revocation():
    reset_revocation_store()
    jti = "test_jti_12345"
    assert not await is_token_revoked(jti)
    
    # Revoke token
    await revoke_token(jti, time.time() + 3600)
    assert await is_token_revoked(jti)


from app.services.email_service import outbox

@pytest.mark.asyncio
async def test_logout_endpoint_revocation(client, db_session):
    set_bypass_rate_limiting(True)
    # Send OTP
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr_logout@test.com", "hr_name": "Test HR", "hr_phone": "+919876543210"
    })
    assert response.status_code == 200
    challenge_id = response.json()["data"]["challenge_id"]
    otp = outbox[-1][2]
    
    # Verify OTP
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    assert response.status_code == 200
    token = response.json()["data"]["session_token"]
    
    # Check authorized access
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    
    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["data"]["revoked"] is True
    
    # Subsequent access should be blocked with 401
    res_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_after.status_code == 401
    assert res_after.json()["error_code"] == "TOKEN_REVOKED"


async def _get_auth_headers(client):
    response = client.post("/api/v1/email/send-otp", json={
        "company_name": "Test Company",
        "hr_email": "hr_security_test@test.com", "hr_name": "Test HR", "hr_phone": "+919876543210"
    })
    challenge_id = response.json()["data"]["challenge_id"]
    otp = outbox[-1][2]
    response = client.post("/api/v1/email/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": otp
    })
    token = response.json()["data"]["session_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_magic_byte_validation_rejects_fake_pdf(client):
    """
    Test 1: Sending a fake .pdf file containing script/malicious payload
    is rejected with 400 due to binary magic-byte mismatch.
    """
    auth_headers = await _get_auth_headers(client)
    fake_pdf_content = b"<script>alert('xss attack')</script>"
    files = {
        "file": ("malicious.pdf", fake_pdf_content, "application/pdf")
    }
    response = client.post("/api/v1/verification/upload-certificate", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "Invalid or corrupted file signature" in response.json()["message"]


@pytest.mark.asyncio
async def test_magic_byte_accepts_valid_pdf_signature(client):
    """
    A valid PDF signature (%PDF-) must pass magic byte inspection.
    """
    auth_headers = await _get_auth_headers(client)
    valid_pdf_content = b"%PDF-1.4\n%Fake PDF binary test content\n%%EOF"
    files = {
        "file": ("valid.pdf", valid_pdf_content, "application/pdf")
    }
    response = client.post("/api/v1/verification/upload-certificate", files=files, headers=auth_headers)
    assert response.status_code == 200
    assert "file_url" in response.json()
    assert response.json()["file_url"].startswith("/api/v1/verification/certificate/")


@pytest.mark.asyncio
async def test_oversized_file_upload_rejected(client):
    """
    Uploading a file exceeding 5MB must be rejected with 413 Payload Too Large.
    """
    auth_headers = await _get_auth_headers(client)
    # Create 5MB + 1KB buffer starting with valid PDF magic bytes
    large_payload = b"%PDF-" + b"0" * (5 * 1024 * 1024 + 1024)
    files = {
        "file": ("large.pdf", large_payload, "application/pdf")
    }
    response = client.post("/api/v1/verification/upload-certificate", files=files, headers=auth_headers)
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["message"]


@pytest.mark.asyncio
async def test_x_forwarded_for_spoofing_prevented():
    """
    Test 2: Rotating X-Forwarded-For headers when TRUST_PROXY_HEADERS is False
    does NOT bypass the rate limiter (still triggers 429).
    """
    settings = get_settings()
    original_setting = settings.TRUST_PROXY_HEADERS
    settings.TRUST_PROXY_HEADERS = False

    try:
        set_bypass_rate_limiting(False)
        reset_rate_limiter()
        limiter = RateLimiter(max_requests=2, window_seconds=60)

        # Base mock request with fixed client IP
        mock_request = Mock()
        mock_request.url.path = "/api/v1/test"
        mock_request.client.host = "10.0.0.1"

        # 1st request with spoofed X-Forwarded-For
        mock_request.headers = {"x-forwarded-for": "1.2.3.4"}
        await limiter(mock_request)

        # 2nd request with different spoofed X-Forwarded-For
        mock_request.headers = {"x-forwarded-for": "5.6.7.8"}
        await limiter(mock_request)

        # 3rd request with yet another spoofed X-Forwarded-For should fail with 429
        mock_request.headers = {"x-forwarded-for": "9.10.11.12"}
        with pytest.raises(HTTPException) as exc:
            await limiter(mock_request)
        assert exc.value.status_code == 429
    finally:
        settings.TRUST_PROXY_HEADERS = original_setting
        set_bypass_rate_limiting(True)


@pytest.mark.asyncio
async def test_security_headers_present(client):
    """
    Test 3: Security headers (X-Content-Type-Options, X-Frame-Options,
    Referrer-Policy, Permissions-Policy) are present on API responses.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "SAMEORIGIN"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in response.headers.get("permissions-policy", "")

