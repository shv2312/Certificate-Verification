# SIET Academic Background Verification Portal

**Sri Shakthi Institute of Engineering and Technology (SIET)**

An official institutional service for HR departments and companies to
verify the academic background of candidates against SIET's authoritative
student records.

---

## Project Team

| Member | Role | Primary Technologies |
|--------|------|----------------------|
| Sanjay V | Frontend & UI/UX Lead | React.js, TypeScript, Vite, Tailwind CSS |
| Shri Hari Vishnu S | Backend & Project Integration Lead | Python, FastAPI |
| Parthiban V | Database, Verification Engine & Deployment Lead | PostgreSQL, Python |
| Sampreeth G | Security Architect & Full-Stack Engineer | Python, FastAPI, React.js, Vite |

### Engineering & Security Architecture Credits

#### **Sampreeth G** — *Security Architect & Full-Stack Engineer*
- **Application Security & Hardening Architecture:** Architected and implemented multi-tier security defenses across FastAPI and React, including role-based access control (RBAC), directory traversal prevention, streaming file upload limits with binary magic-byte inspection (PDF, PNG, JPEG), and global security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`).
- **Defensive Traffic & Session Engineering:** Designed and built an async-safe sliding-window IP rate limiter with proxy-header spoofing defenses (`TRUST_PROXY_HEADERS` validation), automatic memory eviction bounds to avoid OOM denial-of-service, stateful token revocation registry (`jti`), and instant session invalidation on logout.
- **Automated Security Verification:** Built the automated exploit test suite (`test_remediation_security.py`) to validate rate-limit thresholds, magic-byte mismatch rejection, upload size boundary limits (HTTP 413), and header enforcement across the backend.
- **Performance & Frontend Code-Splitting:** Restructured the React router with lazy route boundaries (`React.lazy` and `Suspense`) and configured Vite/Rollup manual chunk partitioning, reducing the initial JavaScript payload by 93% (from 923 kB down to 61 kB).

---

## Security Architecture

The SIET Verification Portal adheres to a defense-in-depth model across Phases 1 through 6:
- **Streaming Upload Guard & Magic-Byte File Inspection:** File uploads (`/api/v1/verification/upload-certificate`) are read in 64 KB chunks capped at 5 MB (returning `413 Payload Too Large` on overflow). Raw binary signatures are validated before disk persistence:
  - PDF: `b"%PDF-"`
  - PNG: `b"\x89PNG\r\n\x1a\n"`
  - JPEG: `b"\xff\xd8\xff"`
- **Authenticated Certificate Streaming & Nosniff:** Public `/uploads` static file mounts are eliminated. Certificates are streamed via authenticated endpoints (`/api/v1/verification/certificate/{filename}`) enforcing blob retrieval and `X-Content-Type-Options: nosniff` alongside `Content-Disposition: inline`.
- **Anti-Spoofing Rate Limiting & Memory Eviction:** Sliding-window IP rate limiter prevents brute force attacks. Only evaluates `X-Forwarded-For` if `TRUST_PROXY_HEADERS=True` is explicitly configured; otherwise binds strictly to `request.client.host`. In-memory storage is bounded to prevent OOM crashes.
- **Stateful Token Revocation Registry:** Session tokens (`jti`) are checked on every authenticated request against a thread-safe revocation registry, enabling instant revocation upon HR or Admin logout.
- **Payment Integrity & Replay Defense:** Cryptographic HMAC-SHA256 signature verification (`razorpay_order_id + "|" + razorpay_payment_id` signed with `RAZORPAY_KEY_SECRET`) with strict atomic state checks preventing payment replay attacks.
- **Global Security Headers Middleware:** Responses automatically include standard security headers (`X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy`).
- **Production API Exposure Protection:** Interactive documentation (`/docs`, `/redoc`, and `/openapi.json`) is strictly disabled in production environments (`APP_ENV=production`).

---

## High-Level Architecture

```
College Website
      ↓
Background Verification Portal (React – Sanjay)
      ↓
FastAPI Backend (Python – Shri Hari)
      ↓
Verification Engine + PostgreSQL (Parthiban)
```

## Approved Workflow

1. HR/Company enters company name + official email
2. Email OTP verification
3. Payment gateway
4. Unlock candidate details form (one payment = one candidate)
5. HR enters candidate details → confirmation screen
6. Backend verifies against institutional database
7. VERIFIED → official report sent to verified HR email
8. NOT VERIFIED → neutral failure response (no manual review in V1)

---

## Repository Structure

```
.
├── backend/            ← FastAPI backend (Shri Hari)
├── frontend/           ← React frontend (Sanjay)
├── database/           ← DB schemas & engine (Parthiban)
├── docs/               ← Work logs and contracts
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env     # fill in your local values
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs (development only)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Development Methodology

Agile Software Development – Sprint-based delivery.

See `docs/` for individual work logs and integration log.

---

## Security Notes

- Never commit `.env` files containing real credentials
- See `.env.example` for required configuration keys
- Payment gateway credentials must be set via environment variables only
- Student data must never be committed to this repository

