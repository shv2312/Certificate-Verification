import asyncio
import secrets
from httpx import AsyncClient
from httpx import AsyncClient, ASGITransport
from app.main import create_app
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionFactory

app = create_app()

async def run_e2e():
    async with AsyncSessionFactory() as session:
        from sqlalchemy import text
        await session.execute(text("TRUNCATE TABLE verification_requests CASCADE"))
        await session.execute(text("TRUNCATE TABLE payment_sessions CASCADE"))
        await session.execute(text("TRUNCATE TABLE email_challenges CASCADE"))
        await session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Send OTP
        resp = await client.post("/api/v1/email/send-otp", json={
            "company_name": "Test QA",
            "hr_email": "qa7@test.com"
        })
        assert resp.status_code == 200, resp.text
        challenge_id = resp.json()["data"]["challenge_id"]
        otp = resp.json()["data"]["dev_otp"]

        # 2. Verify OTP
        resp = await client.post("/api/v1/email/verify-otp", json={
            "challenge_id": challenge_id,
            "otp": otp
        })
        assert resp.status_code == 200, resp.text
        session_token = resp.json()["data"]["session_token"]
        headers = {"Authorization": f"Bearer {session_token}"}

        # 3. Initiate Payment
        resp = await client.post("/api/v1/payment/initiate", json={}, headers=headers)
        assert resp.status_code == 200, resp.text
        payment_data = resp.json()["data"]
        payment_session_id = payment_data["payment_session_id"]
        order_id = payment_data["gateway_order_id"]

        # Since we are not doing a real Razorpay checkout, we cannot use /verify-checkout because it hits the real Razorpay SDK which will fail for a mock order.
        # But wait, in the test I can't hit Razorpay API. Let's just use /dev/confirm/{payment_session_id} to mock the payment capture for this e2e test.
        resp = await client.post(f"/api/v1/payment/dev/confirm/{payment_session_id}", headers=headers)
        assert resp.status_code == 200, resp.text
        verification_request_id = resp.json()["data"]["verification_request_id"]

        # 4. Bind Candidate
        candidate_data = {
            "verification_request_id": verification_request_id,
            "candidate_name": "John Doe",
            "register_number": "12345678",
            "course": "B.E.",
            "branch": "Computer Science",
            "year_of_passing": 2024
        }
        resp = await client.post("/api/v1/verification/bind-candidate", json={
            "verification_request_id": verification_request_id,
            "candidate": candidate_data
        }, headers=headers)
        assert resp.status_code == 200, resp.text
        print("Candidate bound successfully!")

        # 5. Attempt second candidate binding using same payment
        candidate_data["candidate_name"] = "Jane Doe"
        candidate_data["register_number"] = "87654321"
        resp = await client.post("/api/v1/verification/bind-candidate", json={
            "verification_request_id": verification_request_id,
            "candidate": candidate_data
        }, headers=headers)
        print("Second bind attempt status:", resp.status_code)
        assert resp.status_code == 409, "Should be rejected (payment reused)"
        print("Second bind attempt correctly rejected!")

if __name__ == "__main__":
    asyncio.run(run_e2e())
