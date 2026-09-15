import json
import time
import pytest
import hmac
import hashlib
from httpx import AsyncClient
from app.db.models import PaymentSession, VerificationRequest

# Fixtures from backend tests will provide client and db_session

@pytest.mark.asyncio
async def test_razorpay_webhook_signature_verification_success(client, db_session):
    # Create a pending payment session
    payment_session_id = "test_pay_sess_valid"
    order_id = "order_valid_123"
    
    session = PaymentSession(
        id=payment_session_id,
        gateway_order_id=order_id,
        amount_paise=50000,
        status="PAYMENT_PENDING",
        created_at=int(time.time()),
    )
    db_session.add(session)
    await db_session.commit()

    # Payload
    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "receipt": payment_session_id,
                    "notes": {
                        "company_name": "Test Company",
                        "hr_email": "hr@test.com"
                    }
                }
            }
        }
    }
    raw_body = json.dumps(payload).encode('utf-8')
    secret = "test_webhook_secret_123"
    
    # Generate valid signature
    signature = hmac.new(
        secret.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    # We need to temporarily set the settings webhook secret so it matches
    from app.config import get_settings
    settings = get_settings()
    original_secret = settings.PAYMENT_GATEWAY_WEBHOOK_SECRET
    settings.PAYMENT_GATEWAY_WEBHOOK_SECRET = secret
    # Mocking DEV_MOCK_PAYMENT to False for this test
    original_mock = settings.DEV_MOCK_PAYMENT
    settings.DEV_MOCK_PAYMENT = False
    
    # We must also mock Razorpay client to not hit the internet
    import razorpay
    original_verify = razorpay.Utility.verify_webhook_signature
    def mock_verify(self, body, signature, secret):
        expected_sig = hmac.new(secret.encode('utf-8'), body.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            raise Exception("Signature verification failed")
        return True
    
    razorpay.Utility.verify_webhook_signature = mock_verify

    response = client.post(
        "/api/v1/payment/webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": signature}
    )

    # Restore settings and mocks
    settings.PAYMENT_GATEWAY_WEBHOOK_SECRET = original_secret
    settings.DEV_MOCK_PAYMENT = original_mock
    razorpay.Utility.verify_webhook_signature = original_verify

    assert response.status_code == 200
    
    # Check DB
    await db_session.refresh(session)
    assert session.status == "PAID_UNUSED"
    assert session.verification_request_id is not None
    
    # Check VerificationRequest created
    v_req = await db_session.get(VerificationRequest, session.verification_request_id)
    assert v_req is not None
    assert v_req.company_name == "Test Company"
    assert v_req.hr_email == "hr@test.com"

@pytest.mark.asyncio
async def test_razorpay_webhook_invalid_signature(client, db_session):
    payload = {"event": "payment.captured"}
    raw_body = json.dumps(payload).encode('utf-8')
    
    # Generate invalid signature
    signature = "invalid_signature"

    from app.config import get_settings
    settings = get_settings()
    original_mock = settings.DEV_MOCK_PAYMENT
    settings.DEV_MOCK_PAYMENT = False
    
    import razorpay
    original_verify = razorpay.Utility.verify_webhook_signature
    def mock_verify(self, body, signature, secret):
        raise Exception("Signature verification failed")
    
    razorpay.Utility.verify_webhook_signature = mock_verify

    response = client.post(
        "/api/v1/payment/webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": signature}
    )

    settings.DEV_MOCK_PAYMENT = original_mock
    razorpay.Utility.verify_webhook_signature = original_verify

    # FastAPI will return 500 or bubble up exception because we raised ValueError in the service
    assert response.status_code == 409
