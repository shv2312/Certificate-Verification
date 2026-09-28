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
# Edit .env with your local values

# 4. Run development server
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
| FastAPI foundation | ✅ Done | |
| Configuration | ✅ Done | Env-based, no committed secrets |
| Health endpoint | ✅ Done | |
| CORS | ✅ Done | Dev origins only |
| Error handling | ✅ Done | No raw exceptions to client |
| Email OTP (dev mock) | ✅ Done | Real SMTP Sprint 2+ |
| Payment (dev mock) | ✅ Done | Real gateway Sprint 2+ (pending college approval) |
| Verification state machine | ✅ Done | |
| DB session | ✅ Done | Wiring to Parthiban pending |
| Verification engine | 🔴 Blocked | Awaiting Parthiban's implementation |
| Real SMTP | 🔴 Blocked | Awaiting SMTP credentials |
| Real payment gateway | 🔴 Blocked | Awaiting college gateway approval |
| Tests | ✅ Done | Health, schemas, error handling |

---

## Security Notes

- `.env` is gitignored – never commit real credentials
- OTP stored as HMAC (not plain text)
- Session tokens are HMAC-signed
- Payment secret key never sent to frontend
- Error responses never expose stack traces, SQL, or secrets
- API docs disabled in production (`APP_DEBUG=false`)
