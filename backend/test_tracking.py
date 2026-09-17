import asyncio
from httpx import AsyncClient

async def check_tracking():
    async with AsyncClient(base_url="http://localhost:8000") as client:
        # First get a token
        resp = await client.post("/api/v1/email/send-otp", json={
            "company_name": "Test QA",
            "hr_email": "trackingtest@test.com"
        })
        challenge_id = resp.json()["data"]["challenge_id"]
        otp = resp.json()["data"]["dev_otp"]
        
        resp = await client.post("/api/v1/email/verify-otp", json={
            "challenge_id": challenge_id,
            "otp": otp
        })
        token = resp.json()["data"]["session_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get("/api/v1/verification/UNKNOWN_ID_123/status", headers=headers)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(check_tracking())
