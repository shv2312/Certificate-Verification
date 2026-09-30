import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://127.0.0.1:8000/api/v1/email/send-otp", 
            json={
                "company_name": "SIET Verification Test",
                "hr_name": "Shri Hari Vishnu S",
                "hr_email": "shriharivishnu2312@gmail.com",
                "hr_phone": "+918271455444",
                "requester_role": "HR Manager"
            },
            timeout=15.0
        )
        print("Status Code:", res.status_code)
        print("Response:", res.json())

asyncio.run(test())
