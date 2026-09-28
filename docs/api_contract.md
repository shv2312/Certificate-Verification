# Frontend ↔ Backend API Contract
## SIET Academic Background Verification Portal

**Version:** Sprint 1  
**Backend:** Shri Hari Vishnu S (FastAPI, Python)  
**Frontend:** Sanjay V (React, TypeScript, Vite, Tailwind CSS)

---

> [!IMPORTANT]
> This is the authoritative contract between Sanjay's React frontend and
> Shri Hari's FastAPI backend.  Both sides must implement these exact shapes.
> Do NOT call PostgreSQL directly from the frontend.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production | `https://bgv.siet.ac.in` (pending SIET server setup) |

## Authentication

After email OTP verification, all subsequent requests must include:

```
Authorization: Bearer <session_token>
```

The `session_token` is returned by `POST /api/v1/email/verify-otp`.

---

## Response Envelope

All API responses follow this consistent structure:

### Success
```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error description",
  "error_code": "MACHINE_READABLE_CODE",
  "details": [ ... ]   // optional, for validation errors only
}
```

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `EMAIL_VERIFICATION_REQUIRED` | 401 | Must verify email first |
| `INVALID_SESSION_TOKEN` | 401 | Token format invalid |
| `INVALID_SESSION_SIGNATURE` | 401 | Token was tampered with |
| `SESSION_EXPIRED` | 401 | Session > 4 hours old |
| `FORBIDDEN` | 403 | Session does not own this request |
| `NOT_FOUND` | 404 | Resource does not exist |
| `STATE_CONFLICT` | 409 | Business rule violation |
| `VALIDATION_ERROR` | 422 | Input field errors |
| `SERVICE_UNAVAILABLE` | 503 | Dependency not ready (verification engine) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### 1. Health Check

```
GET /api/health
```

**Auth:** None

**Response 200:**
```json
{
  "success": true,
  "message": "SIET Academic Background Verification backend is running.",
  "data": {
    "status": "ok",
    "environment": "development",
    "version": "1.0.0-sprint1"
  }
}
```

---

### 2. Send OTP

```
POST /api/v1/email/send-otp
```

**Auth:** None

**Request:**
```json
{
  "company_name": "Acme Technologies Pvt. Ltd.",
  "hr_email": "hr@acmetechnologies.com"
}
```

**Validation rules:**
- `company_name`: 2–200 chars, required
- `hr_email`: valid email format, required

**Response 200:**
```json
{
  "success": true,
  "message": "Verification code sent to hr***@acmetechnologies.com. Please check your email.",
  "data": {
    "masked_email": "hr***@acmetechnologies.com",
    "resend_allowed_after_seconds": 60,
    "dev_otp": "123456"   // DEVELOPMENT ONLY – null in production
  }
}
```

> [!WARNING]
> `dev_otp` is only populated when `DEV_MOCK_OTP=true` on the server.
> Sanjay: do NOT display `dev_otp` in a user-facing element in production builds.
> It can be shown in a debug panel during development.

**Response 409 (cooldown active):**
```json
{
  "success": false,
  "message": "Please wait 45 seconds before requesting a new OTP.",
  "error_code": "STATE_CONFLICT"
}
```

---

### 3. Verify OTP

```
POST /api/v1/email/verify-otp
```

**Auth:** None

**Request:**
```json
{
  "challenge_id": "<from send-otp response data – currently not returned>",
  "otp": "123456"
}
```

> [!IMPORTANT]
> **Current gap:** The `send-otp` response does not yet return `challenge_id`.
> This will be added in a Sprint 1 patch.  Sanjay should store the full data object
> from `send-otp` and extract `challenge_id` from it.

**Response 200:**
```json
{
  "success": true,
  "message": "Email verified successfully for Acme Technologies Pvt. Ltd. You may now proceed to payment.",
  "data": {
    "session_token": "<opaque-token>",
    "verified_company": "Acme Technologies Pvt. Ltd.",
    "verified_email": "hr@acmetechnologies.com"
  }
}
```

---

### 4. Initiate Payment

```
POST /api/v1/payment/initiate
```

**Auth:** `Authorization: Bearer <session_token>`

**Request body:** Empty `{}`

**Response 200:**
```json
{
  "success": true,
  "message": "Payment session created. Please complete the payment.",
  "data": {
    "payment_session_id": "<backend-session-id>",
    "gateway_order_id": "<payment-provider-order-id>",
    "gateway_key_id": "<PUBLIC-key-id-only – NOT the secret>",
    "amount_paise": 50000,
    "currency": "INR",
    "description": "SIET Academic Background Verification"
  }
}
```

> [!CAUTION]
> Sanjay: Use `gateway_key_id` (public) when opening the payment widget.
> The payment gateway SECRET is NEVER sent to the frontend.

---

### 5. DEV: Confirm Payment (Development Only)

```
POST /api/v1/payment/dev/confirm/{payment_session_id}
```

**Auth:** `Authorization: Bearer <session_token>`

**Purpose:** Simulates a successful payment without a real gateway.
Only active when `DEV_MOCK_PAYMENT=true` on the server.

**Response 200:**
```json
{
  "success": true,
  "message": "[DEV] Payment simulated. Verification request BGV-2026-000001 is now ready.",
  "data": {
    "payment_session_id": "<session-id>",
    "status": "PAID_UNUSED",
    "verification_request_id": "<internal-uuid>",
    "display_request_id": "BGV-2026-000001"
  }
}
```

---

### 6. Payment Status

```
GET /api/v1/payment/{payment_session_id}/status
```

**Auth:** `Authorization: Bearer <session_token>`

**Response 200:**
```json
{
  "success": true,
  "message": "Payment status: PAID_UNUSED",
  "data": {
    "payment_session_id": "<session-id>",
    "status": "PAID_UNUSED",
    "verification_request_id": "<uuid – populated after payment confirmed>",
    "display_request_id": "BGV-2026-000001"
  }
}
```

**Status values:** `PAYMENT_PENDING` | `PAID_UNUSED` | `FAILED` | `EXPIRED`

---

### 7. Bind Candidate

```
POST /api/v1/verification/bind-candidate
```

**Auth:** `Authorization: Bearer <session_token>`

**Request:**
```json
{
  "verification_request_id": "<uuid from payment status>",
  "candidate": {
    "candidate_name": "Arjun Ramaswamy",
    "register_number": "710621104001",
    "course": "B.E.",
    "branch": "Computer Science and Engineering",
    "year_of_passing": 2024
  }
}
```

**Validation rules (all mandatory):**
- `candidate_name`: 2–150 chars
- `register_number`: 3–30 chars, alphanumeric + hyphens/slashes only
- `course`: 2–100 chars
- `branch`: 2–150 chars
- `year_of_passing`: integer, 1990–2100

**Response 200:**
```json
{
  "success": true,
  "message": "Candidate details accepted. Please review and confirm to proceed.",
  "data": {
    "verification_request_id": "<uuid>",
    "display_request_id": "BGV-2026-000001",
    "status": "CANDIDATE_BOUND",
    "candidate": { ... },
    "warning": "This payment can be used for one candidate verification only. Please review the details carefully before confirming."
  }
}
```

---

### 8. Confirm & Verify

```
POST /api/v1/verification/confirm
```

**Auth:** `Authorization: Bearer <session_token>`

**Request:**
```json
{
  "verification_request_id": "<uuid>"
}
```

**Response 200 (VERIFIED):**
```json
{
  "success": true,
  "message": "Verification successful. The official report has been sent to your verified email.",
  "data": {
    "verification_request_id": "<uuid>",
    "display_request_id": "BGV-2026-000001",
    "status": "VERIFIED",
    "candidate_name": "Arjun Ramaswamy",
    "university_name": "Anna University",
    "institute_name": "Sri Shakthi Institute of Engineering and Technology",
    "course": "B.E.",
    "branch": "Computer Science and Engineering",
    "register_number": "710621104001",
    "year_of_passing": 2024,
    "backlog_status": "No Backlog",
    "period_of_study": "2020–2024",
    "mode_of_education": "Full-time",
    "message": "Verification successful. ...",
    "verification_reference_url": "http://localhost:8000/verify/<uuid>"
  }
}
```

**Response 200 (NOT_VERIFIED):**
```json
{
  "success": true,
  "message": "The submitted candidate details could not be verified against the official institutional records.",
  "data": {
    "verification_request_id": "<uuid>",
    "display_request_id": "BGV-2026-000001",
    "status": "NOT_VERIFIED",
    "message": "The submitted candidate details could not be verified against the official institutional records.",
    "candidate_name": null,
    "university_name": null,
    ...
  }
}
```

> [!IMPORTANT]
> Sanjay: `success: true` even on NOT_VERIFIED because the API call itself succeeded.
> Check `data.status` to determine verified vs not-verified display.

**Response 503:** Verification engine not yet integrated (Sprint 1 blocker).

---

### 9. Verification Status

```
GET /api/v1/verification/{request_id}/status
```

**Auth:** `Authorization: Bearer <session_token>`

**Response 200:**
```json
{
  "success": true,
  "message": "Request status: VERIFIED",
  "data": {
    "verification_request_id": "<uuid>",
    "display_request_id": "BGV-2026-000001",
    "status": "VERIFIED",
    "company_name": "Acme Technologies Pvt. Ltd.",
    "hr_email": "hr@acmetechnologies.com"
  }
}
```

---

## Known Gaps / Open Items (Sprint 1)

| Item | Owner | Status |
|------|-------|--------|
| `challenge_id` not returned by send-otp response | Shri Hari | To fix in patch |
| Real SMTP email delivery | Shri Hari | Sprint 2 |
| Real payment gateway | All | Pending college approval |
| Verification engine integration | Parthiban | Sprint 2 |
| In-process stores → PostgreSQL | Shri Hari + Parthiban | Sprint 2 |
| IP-level rate limiting | Shri Hari | Sprint 2 |
| Report PDF generation | Shri Hari | Sprint 3+ |
