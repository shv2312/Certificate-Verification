# Frontend API Handoff
**Project:** SIET Academic Background Verification Portal  
**Maintainer:** Shri Hari Vishnu S (Backend)  
**Date:** 2026-09-07

This document defines the exact API contracts and readiness state for Sanjay V (Frontend) to continue UI integration.

## 1. Authentication Flow (Email OTP)
**Status:** ✅ **READY FOR FRONTEND INTEGRATION**

- **POST `/api/v1/email/send-otp`**
  - **Auth:** None
  - **Payload:** `{ "company_name": "Test Company", "hr_email": "hr@test.com" }`
  - **Response:** `{ "success": true, "data": { "challenge_id": "...", "masked_email": "...", "resend_allowed_after_seconds": 60, "dev_otp": "123456" } }`
  - **Note:** In development, `DEV_MOCK_OTP=True`, meaning real emails aren't sent and the OTP is returned in `dev_otp`.

- **POST `/api/v1/email/verify-otp`**
  - **Auth:** None
  - **Payload:** `{ "challenge_id": "...", "otp": "123456" }`
  - **Response:** `{ "success": true, "data": { "session_token": "...", "verified_company": "...", "verified_email": "...", "role": "hr" } }`
  - **Frontend Action:** Save `session_token` securely (React state or secure storage). Use it in the `Authorization: Bearer <token>` header for all following API requests. Route user based on `role` (`'hr'` or `'admin'`). 

## 2. Payment Flow
**Status:** 🚧 **PARTIALLY BLOCKED (Pending College Approval)**

- **POST `/api/v1/payment/initiate`**
  - **Auth:** `Bearer <session_token>`
  - **Payload:** `{}`
  - **Response:** `{ "success": true, "data": { "payment_session_id": "...", "gateway_order_id": "...", "gateway_key_id": "...", "amount_paise": 50000, "currency": "INR", "description": "..." } }`
  - **Note:** Do NOT call a real gateway yet. Proceed with the DEV confirm endpoint.

- **POST `/api/v1/payment/dev/confirm/{payment_session_id}`** (DEV ONLY)
  - **Auth:** `Bearer <session_token>`
  - **Payload:** `{}`
  - **Response:** Confirms payment and unlocks verification.

- **GET `/api/v1/payment/{payment_session_id}/status`**
  - **Auth:** `Bearer <session_token>`
  - **Response:** `{ "success": true, "data": { "payment_session_id": "...", "status": "PAID_UNUSED", "verification_request_id": "req_abc123", "display_request_id": "SIET-123" } }`
  - **Frontend Action:** Once status is `PAID_UNUSED`, use the `verification_request_id` to bind a candidate.

## 3. Candidate Details (Binding)
**Status:** ✅ **READY FOR FRONTEND INTEGRATION**

- **POST `/api/v1/verification/bind-candidate`**
  - **Auth:** `Bearer <session_token>`
  - **Payload:** 
    ```json
    {
      "verification_request_id": "req_abc123",
      "candidate": {
        "candidate_name": "Arjun Ramaswamy",
        "register_number": "710621104001",
        "course": "B.E.",
        "branch": "Computer Science and Engineering",
        "year_of_passing": 2024
      }
    }
    ```
  - **Response:** Status becomes `CANDIDATE_BOUND`. Displays a warning to confirm details.

## 4. Verification Confirmation & Results
**Status:** ✅ **READY FOR FRONTEND INTEGRATION**

- **POST `/api/v1/verification/confirm`**
  - **Auth:** `Bearer <session_token>`
  - **Payload:** `{ "verification_request_id": "req_abc123" }`
  - **Response:** 
    ```json
    {
      "success": true,
      "data": {
        "verification_request_id": "req_abc123",
        "display_request_id": "SIET-123",
        "status": "VERIFIED",
        "candidate_name": "ARJUN RAMASWAMY",
        "university_name": "Sri Shakthi Institute of Engineering and Technology",
        "institute_name": "SIET",
        "course": "B.E.",
        "branch": "COMPUTER SCIENCE AND ENGINEERING",
        "register_number": "710621104001",
        "year_of_passing": 2024,
        "backlog_status": "NO BACKLOGS",
        "period_of_study": "2020-2024",
        "mode_of_education": "FULL TIME",
        "message": "Candidate verified successfully."
      }
    }
    ```
  - **Note:** In case of failure, `status` will be `NOT_VERIFIED`, and student fields (like `candidate_name`, `course`, etc.) will be `null` to ensure data privacy.

- **GET `/api/v1/verification/{verification_request_id}/status`**
  - **Auth:** `Bearer <session_token>`
  - **Response:** Checks the status (`CANDIDATE_BOUND`, `VERIFIED`, `NOT_VERIFIED`).

## Missing Services & Next Steps
- Real SMTP configuration is pending SIET approval. Continue to use `dev_otp` in development.
- Real Payment Gateway configuration is pending. Continue to use `POST /api/v1/payment/dev/confirm/{id}` for development.
- **Sanjay's Actionable Items:** You can now fully connect the Candidate Details Submission, the Confirmation Screen, and the Verification Result screens utilizing the mock payment flow to get to the Verification endpoints.
