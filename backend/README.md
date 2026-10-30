# SIET BGV Backend

**Python 3.13+ | FastAPI**

Backend API for the SIET Academic Background Verification Portal.

---

## Quick Start

```bash
# From this directory (backend/)

# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # Linux / macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your local values if needed (SQLite is default)

# 4. Initialize Database
python create_dev_local.py

# 5. Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API documentation: http://localhost:8000/docs  *(development only)*
Health check:      http://localhost:8000/api/health

---

## Architecture

```
app/
├── main.py                  FastAPI app factory + startup
├── config.py                Pydantic Settings (env-based)
├── dependencies.py          Shared FastAPI dependencies (session validation)
├── routes/
│   ├── health.py            GET  /api/health
│   ├── email_verification.py POST /api/v1/email/send-otp
│   │                         POST /api/v1/email/verify-otp
│   ├── payment.py           POST /api/v1/payment/initiate
│   │                         POST /api/v1/payment/webhook
│   │                         GET  /api/v1/payment/{id}/status
│   │                         POST /api/v1/payment/dev/confirm/{id}  [DEV]
│   └── verification.py      POST /api/v1/verification/bind-candidate
│                             POST /api/v1/verification/confirm
│                             GET  /api/v1/verification/{id}/status
├── schemas/
│   ├── common.py            APIResponse[T] and APIError envelopes
│   ├── email_verification.py
│   ├── payment.py
│   └── verification.py
├── services/
│   ├── email_service.py     OTP generation, verification, SMTP dispatch
│   ├── payment_service.py   Payment state machine
│   └── verification_service.py  Candidate bind/confirm/verify
├── db/
│   └── session.py           Async SQLAlchemy session (Parthiban's PostgreSQL)
└── middleware/
    └── error_handlers.py    Global safe error handling
```

---

## Running Tests

```bash
# From backend/ directory with .venv activated
pytest
```

---

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/health | None | Health check |
| POST | /api/v1/email/send-otp | None | Send OTP to HR email |
| POST | /api/v1/email/verify-otp | None | Verify OTP → session token |
| POST | /api/v1/payment/initiate | Bearer | Initiate payment |
| POST | /api/v1/payment/webhook | Provider | Payment callback |
| GET | /api/v1/payment/{id}/status | Bearer | Poll payment status |
| POST | /api/v1/payment/dev/confirm/{id} | Bearer | [DEV] Simulate payment |
| POST | /api/v1/verification/bind-candidate | Bearer | Bind candidate to request |
| POST | /api/v1/verification/confirm | Bearer | Confirm & verify candidate |
| GET | /api/v1/verification/{id}/status | Bearer | Get verification status |

---

## Sprint 1 Status

| Feature | Status | Notes |
|---------|--------|-------|
| FastAPI foundation | Done | |
| Configuration | Done | Env-based, no committed secrets |
| Health endpoint | Done | |
| CORS | Done | Dev origins only |
| Error handling | Done | No raw exceptions to client |
| Email OTP (dev mock) | Done | Real SMTP Sprint 2+ |
| Payment (dev mock) | Done | Real gateway Sprint 2+ (pending college approval) |
| Verification state machine | Done | |
| DB session | Done | Wiring to Parthiban pending |
| Verification engine | Blocked | Awaiting Parthiban's implementation |
| Real SMTP | Blocked | Awaiting SMTP credentials |
| Real payment gateway | Blocked | Awaiting college gateway approval |
| Tests | Done | Health, schemas, error handling |

---

## Security & Hardening Architecture (Phase 1–6)

Engineered and hardened with defense-in-depth measures led by **Sampreeth G**:
- `.env` and sensitive credentials are gitignored — never committed.
- Role-based access control (RBAC) across HR and Admin routes.
- Anti-spoofing sliding-window IP rate limiting (`TRUST_PROXY_HEADERS` validation) with automatic memory eviction bounds.
- Session invalidation & token revocation registry (`jti` checks on protected endpoints).
- File upload streaming with 5 MB limits (`413 Payload Too Large`) and binary magic-byte inspection (PDF, PNG, JPEG).
- Authenticated certificate streaming via blob URL with `X-Content-Type-Options: nosniff`.
- Cryptographic HMAC-SHA256 payment signature verification and replay prevention.
- Global HTTP security headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Production API documentation lockdown (`APP_ENV=production` disables `/docs`, `/redoc`, and `/openapi.json`).
- Automated exploit verification suite in `tests/test_remediation_security.py`.

