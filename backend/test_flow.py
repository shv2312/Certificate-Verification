import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = json.dumps(data).encode("utf-8") if data is not None else b""
    if not data and method == "POST":
        req_data = b""
        if path.endswith("/initiate"):
            req_data = b"{}"

    req = urllib.request.Request(url, method=method, headers=headers, data=req_data if req_data else None)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8")), response.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8")), e.code

print("--- FULL INTEGRATION FLOW TEST ---")

# 1. Health
print("\n1. Health Check")
res, status = request("GET", "/api/health")
print(f"Status: {status}\nResponse: {res}")

# 2. Send OTP
print("\n2. Send OTP (Company Details Submit)")
res, status = request("POST", "/api/v1/email/send-otp", {"company_name": "SIET Demo Corp", "hr_email": "demo@sietcorp.com"})
print(f"Status: {status}\nResponse: {res}")
challenge_id = res['data']['challenge_id']
dev_otp = res['data']['dev_otp']
print(f"--> Extracted Challenge ID: {challenge_id}, Dev OTP: {dev_otp}")

# 3. Verify OTP
print("\n3. Verify OTP")
res, status = request("POST", "/api/v1/email/verify-otp", {"challenge_id": challenge_id, "otp": dev_otp})
print(f"Status: {status}\nResponse: {res}")
session_token = res['data']['session_token']
role = res['data']['role']
print(f"--> Extracted Session Token: {session_token[:20]}..., Role: {role}")

# 4. Payment Initiate
print("\n4. Initiate Payment")
res, status = request("POST", "/api/v1/payment/initiate", {}, session_token)
print(f"Status: {status}\nResponse: {res}")
payment_session_id = res['data']['payment_session_id']
print(f"--> Extracted Payment Session ID: {payment_session_id}")

# 5. Payment Dev Confirm
print("\n5. Dev Confirm Payment")
res, status = request("POST", f"/api/v1/payment/dev/confirm/{payment_session_id}", None, session_token)
print(f"Status: {status}\nResponse: {res}")
verification_request_id = res['data']['verification_request_id']
print(f"--> Extracted Verification Request ID: {verification_request_id}")

# 6. Bind Candidate
print("\n6. Bind Candidate")
candidate_payload = {
    "verification_request_id": verification_request_id,
    "candidate": {
        "candidate_name": "TEST STUDENT",
        "register_number": "713020104001",
        "course": "B.E.",
        "branch": "CSE",
        "year_of_passing": 2024
    }
}
res, status = request("POST", "/api/v1/verification/bind-candidate", candidate_payload, session_token)
print(f"Status: {status}\nResponse: " + json.dumps(res).replace('\u2192', '->'))

# 7. Confirm Verification (Trigger Engine)
print("\n7. Confirm Verification (Trigger Engine)")
res, status = request("POST", "/api/v1/verification/confirm", {"verification_request_id": verification_request_id}, session_token)
print(f"Status: {status}\nResponse: " + json.dumps(res).replace('\u2192', '->'))

# 8. Get Verification Result
print("\n8. Get Verification Result")
res, status = request("GET", f"/api/v1/verification/{verification_request_id}/status", None, session_token)
print(f"Status: {status}\nResponse: " + json.dumps(res).replace('\u2192', '->'))
