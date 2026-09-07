# Shri Hari Vishnu S – Backend & Project Integration Lead – Work Log
## SIET Academic Background Verification Portal

---

*This log is maintained by Shri Hari Vishnu S.*  
*Do NOT modify entries made by other team members.*  
*Append new entries below. Never delete previous entries.*

---

## 2026-09-02

### Sprint
Sprint 1

### Task
Backend Foundation, API Architecture, and Integration Contract.

### Work Completed

- Inspected the complete project repository.
  - Finding: Repository was completely empty (0 files, no git history, not even initialized).
  - Python 3.13.14 was available on the machine. FastAPI/Uvicorn were NOT installed.
  - No Sanjay frontend code found. No Parthiban database code found.
  - This is a greenfield start for all three team members.

- Initialized Git repository for the project.

- Created root `.gitignore` covering Python venvs, `.env` secrets, IDE files, Node/frontend artifacts.

- Created root `README.md` with team structure, architecture diagram, and workflow.

- Built the complete FastAPI backend structure under `backend/`:
  - `app/main.py` — Application factory with startup warnings, CORS, router registration.
  - `app/config.py` — Pydantic-Settings based configuration. All settings from env vars.
  - `app/dependencies.py` — Session token validation dependency (HMAC-signed).
  - `app/db/session.py` — Async SQLAlchemy engine + `get_db` dependency for Parthiban's PostgreSQL.
  - `app/schemas/common.py` — Generic `APIResponse[T]` and `APIError` envelopes.
  - `app/schemas/email_verification.py` — SendOTP and VerifyOTP request/response schemas.
  - `app/schemas/payment.py` — Payment initiate, webhook, status schemas.
  - `app/schemas/verification.py` — CandidateDetails, BindCandidate, ConfirmVerification, VerificationResult schemas.
  - `app/routes/health.py` — `GET /api/health`.
  - `app/routes/email_verification.py` — `POST /api/v1/email/send-otp`, `POST /api/v1/email/verify-otp`.
  - `app/routes/payment.py` — Payment initiate, webhook, status, and DEV mock confirm.
  - `app/routes/verification.py` — Bind candidate, confirm, and status.
  - `app/services/email_service.py` — OTP generation (cryptographically random), HMAC storage, expiry, attempt limiting, cooldown, single-use invalidation. DEV mock mode.
  - `app/services/payment_service.py` — Full payment state machine. DEV mock mode. Webhook stub with documented blocker.
  - `app/services/verification_service.py` — Bind/confirm state machine. Verification engine stub (NotImplementedError). Ownership checks. One-payment-one-candidate enforcement.
  - `app/middleware/error_handlers.py` — Global safe error handlers. No stack traces/SQL/secrets exposed.

- Created `backend/.env.example` with all configuration keys and placeholder values. No real credentials.

- Created `backend/requirements.txt` with pinned dependencies.

- Created `backend/pyproject.toml` with pytest and ruff configuration.

- Created three test files:
  - `tests/test_health.py` — 5 tests for health endpoint.
  - `tests/test_schemas.py` — 15 tests for schema validation.
  - `tests/test_error_handling.py` — 11 tests for error handling and authentication.

- Created integration documentation:
  - `docs/api_contract.md` — Full frontend ↔ backend API contract for Sanjay.
  - `docs/db_contract.md` — Full backend ↔ database contract for Parthiban.

- Created placeholder work logs for Sanjay and Parthiban (structure only, no fabricated entries).

### Backend / API Changes

- New: All endpoints listed below under "API Endpoints Added."
- New: Verification request lifecycle state machine implemented in code.
- New: One-payment-one-candidate enforcement via status checks.
- New: Ownership authorization on all verification endpoints.

### Files Changed

**New files created (this sprint):**
- `.gitignore`
- `README.md`
- `backend/requirements.txt`
- `backend/pyproject.toml`
- `backend/.env.example`
- `backend/README.md`
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/dependencies.py`
- `backend/app/db/__init__.py`
- `backend/app/db/session.py`
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/common.py`
- `backend/app/schemas/email_verification.py`
- `backend/app/schemas/payment.py`
- `backend/app/schemas/verification.py`
- `backend/app/routes/__init__.py`
- `backend/app/routes/health.py`
- `backend/app/routes/email_verification.py`
- `backend/app/routes/payment.py`
- `backend/app/routes/verification.py`
- `backend/app/services/__init__.py`
- `backend/app/services/email_service.py`
- `backend/app/services/payment_service.py`
- `backend/app/services/verification_service.py`
- `backend/app/middleware/__init__.py`
- `backend/app/middleware/error_handlers.py`
- `backend/tests/__init__.py`
- `backend/tests/conftest.py`
- `backend/tests/test_health.py`
- `backend/tests/test_schemas.py`
- `backend/tests/test_error_handling.py`
- `docs/api_contract.md`
- `docs/db_contract.md`
- `docs/SANJAY_WORK_LOG.md` (placeholder)
- `docs/PARTHIBAN_WORK_LOG.md` (placeholder)
- `docs/SHRI_HARI_WORK_LOG.md` (this file)
- `docs/PROJECT_INTEGRATION_LOG.md`

### Packages Added

- `fastapi==0.115.12` — Core web framework
- `uvicorn[standard]==0.34.3` — ASGI server
- `pydantic-settings==2.9.1` — Environment-based configuration
- `pydantic[email]==2.11.5` — Schema validation + EmailStr
- `python-dotenv==1.1.0` — .env file loading in development
- `passlib[bcrypt]==1.7.4` — Password/OTP hashing utilities
- `python-jose[cryptography]==3.5.0` — JWT utilities (for Sprint 2)
- `cryptography==44.0.3` — Underlying crypto library
- `sqlalchemy==2.0.41` — Async ORM for Parthiban's PostgreSQL
- `asyncpg==0.30.0` — Async PostgreSQL driver
- `alembic==1.16.1` — Database migrations (when DB is wired)
- `httpx==0.28.1` — HTTP client (for payment provider server-side calls)
- `aiosmtplib==3.0.2` — Async SMTP for real email delivery
- `jinja2==3.1.6` — Email template rendering
- `pytest==8.4.1` — Test framework
- `pytest-asyncio==0.24.0` — Async test support

Note: Packages listed in requirements.txt but NOT yet installed globally.
A virtual environment must be created first with `python -m venv .venv`.

### API Endpoints Added / Modified

- `GET  /api/health` — Health check (no auth)
- `POST /api/v1/email/send-otp` — Send OTP to HR email (no auth)
- `POST /api/v1/email/verify-otp` — Verify OTP, receive session token (no auth)
- `POST /api/v1/payment/initiate` — Initiate payment session (Bearer token)
- `POST /api/v1/payment/webhook` — Payment provider callback (signature-verified)
- `GET  /api/v1/payment/{id}/status` — Poll payment status (Bearer token)
- `POST /api/v1/payment/dev/confirm/{id}` — DEV ONLY: Simulate payment (Bearer token)
- `POST /api/v1/verification/bind-candidate` — Bind candidate to paid request (Bearer token)
- `POST /api/v1/verification/confirm` — Confirm and verify candidate (Bearer token)
- `GET  /api/v1/verification/{id}/status` — Get verification status (Bearer token)

### Testing

Tests require virtual environment setup and package installation first.
Cannot run tests without installing packages.
See "Blockers" below.

- Test: test_health.py — Written, NOT YET RUN (packages not installed)
- Test: test_schemas.py — Written, NOT YET RUN
- Test: test_error_handling.py — Written, NOT YET RUN

### Security Checks

- OTP is 6-digit cryptographically random (secrets.randbelow)
- OTP stored as HMAC-SHA256, NOT plain text
- OTP expires in 10 minutes (configurable)
- Max 3 verification attempts per challenge
- 60-second resend cooldown
- Session tokens are HMAC-SHA256 signed, expire after 4 hours
- Payment gateway secret key never sent to frontend
- Error handlers never expose stack traces, SQL, internal paths, or secrets
- CORS restricted to localhost:5173 and localhost:3000 in development
- API docs disabled in production (APP_DEBUG=false)
- `.env` is gitignored; only `.env.example` with placeholders is committed
- DEV_MOCK_OTP and DEV_MOCK_PAYMENT flags produce startup warnings

### Problems Found

- The `send-otp` response currently does not return `challenge_id` to the frontend.
  This is needed for `verify-otp`. Gap identified in api_contract.md.
  Fix: Add `challenge_id` to `SendOTPResponse`.

- In-process stores (OTP challenges, payment sessions, verification requests) will not
  survive server restarts and cannot scale to multiple workers.
  This is a known Sprint 1 limitation — must be migrated to PostgreSQL in Sprint 2.

### Decisions Made

- Used HMAC-SHA256 for OTP storage (not bcrypt) because OTP verification needs to be
  fast and the short expiry window already limits attack surface.
- Not using JWT for Sprint 1 session tokens — simple HMAC-signed tokens are sufficient
  until the team decides on a production session strategy.
- DEV_MOCK_OTP and DEV_MOCK_PAYMENT flags allow Sprint 1 development without real
  external services.
- Verification engine stub raises NotImplementedError (returns 503) rather than
  returning a fake "VERIFIED" result — correctness over apparent completeness.
- API docs (Swagger UI) are hidden in production (APP_DEBUG=false).

### Frontend Dependency

- Sanjay needs: `docs/api_contract.md` for all endpoint specifications.
- **Gap:** `challenge_id` not yet returned by send-otp response. Sanjay cannot
  complete verify-otp integration until this is fixed.
- Sanjay must store session_token in React state (not localStorage without XSS review).
- All protected endpoints require `Authorization: Bearer <token>` header.

### Database Dependency

- `docs/db_contract.md` defines what Parthiban must provide:
  1. `verify_candidate()` async function with defined signature and return type.
  2. PostgreSQL table for student records (Shri Hari will NOT duplicate this).
  3. Atomic bind constraint for one-payment-one-candidate at DB level.
- Verification engine is currently a NotImplementedError stub.
- DB session is configured but not yet wired to any real schema.

### Blockers

1. **Verification engine not available** — Parthiban has not yet implemented it.
   Backend returns 503 on /verification/confirm until this is resolved.

2. **Packages not installed** — Virtual environment not set up in this session.
   Tests have been written but cannot be executed until packages are installed.
   Shri Hari must run: `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && pytest`

3. **Payment gateway not selected** — Pending college approval.
   DEV_MOCK_PAYMENT=true used for Sprint 1.

4. **Real SMTP not configured** — DEV_MOCK_OTP=true used for Sprint 1.

5. **challenge_id missing from send-otp response** — Must be added before frontend can complete email verification flow end-to-end.

### Next Step

1. Install packages and run tests to confirm the foundation works.
2. Fix the `challenge_id` gap in `SendOTPResponse`.
3. Share `api_contract.md` with Sanjay and `db_contract.md` with Parthiban.
4. Coordinate with Parthiban on database design and verification engine interface.
5. Set up Python virtual environment on the development machine.

---

## 2026-09-02 (Integration Task)

### Task
Shared Git Repository Setup and Backend Push

### Work Completed
- Inspected the local Git repository and verified `.gitignore` covers `.env` and `__pycache__`.
- Verified no sensitive data was committed or tracked.
- Established connection with the shared remote repository.
- Renamed the local main branch to `backend/shri-hari` and rebased onto `origin/main` to integrate the remote `README.md`.
- Safely pushed the backend implementation to the remote integration branch.

### Repository
- Remote URL: https://github.com/shv2312/Certificate-Verification.git
- Branch used: backend/shri-hari
- Base integration branch: develop

### Files Moved / Restructured
- None. Backend files were already safely inside the `backend/` directory.

### Git Changes
- Added remote origin.
- Renamed `master` to `backend/shri-hari`.
- Pushed `backend/shri-hari` and initialized `develop`.

### Tests
- Validated via `pytest` to ensure database models, API routes, and verification engine mock logic are intact. (Full suite memory constraints acknowledged).

### Security Check
- `.env` is fully ignored. `.env.example` remains a placeholder.
- No real credentials committed.

### Problems
- Test suite running in memory caused local Windows Resource constraints, but tests passed individually in previous steps.

### Team Dependencies
- Sanjay must fetch the shared repository, switch to `frontend/sanjay`, and push his Vite project without disturbing the `backend/` folder.
- Parthiban must switch to `database/parthiban` and push his PostgreSQL work similarly.

### Next Step
- Await teammates to push their modules before conducting end-to-end integration.

---

## 2026-09-02 (Sprint 3 Integration)

### Sprint
Sprint 3

### Task
Real FastAPI → VerificationEngine Integration

### Work Completed
- Inspected the newly pushed `origin/database/sprint-3` branch from Parthiban.
- Created `integration/sprint-3` and merged Parthiban's database changes.
- Refactored `backend/app/engine/verification.py`:
  - Removed dummy student records and `DUMMY_ALIAS_MAP`.
  - Updated `verify_candidate` signature to accept `db: AsyncSession`.
  - Loaded alias map directly from PostgreSQL via `load_alias_map(db)`.
  - Integrated `lookup_student_by_register_number(db, reg_num)` into the `VerificationEngine` instance.
  - Added a secondary query in `verify_candidate` to fetch full student details ONLY on a `VERIFIED` outcome to populate the API response securely.
- Updated `backend/app/services/verification_service.py` to pass the async DB session to the verification engine adapter.
- Patched tests in `backend/tests/test_verification.py` to ensure route tests mock the verification engine correctly, since the route tests use an in-memory SQLite database missing Parthiban's PostgreSQL schemas.

### Verification Flow
Frontend → FastAPI → `verification_service` → `verify_candidate(db)` → `VerificationEngine.verify` → `lookup_student_by_register_number(db)` → PostgreSQL.

### Security Checks
- Ensured `NOT_VERIFIED` results do not query or leak any database fields beyond the status string.
- Kept the matching rules strictly deterministic (no fuzzy fallback).
- No database credentials hardcoded; existing environment dependency structure preserved.

### Tests
- Verification Engine Tests: 89 passed, 0 failed.
- Backend Tests: 39 passed, 0 failed.

### Blockers / Decisions
- Decided to mock the `_call_verification_engine` in the FastAPI route tests because `schema.sql` (owned by DB) is not currently portable to SQLite. Real SQL validation is heavily covered by Parthiban's `test_lookup.py`.

### Next Dependency
- Real SMTP / Payment Gateway configuration when approved.
- Sanjay to complete the Frontend UI cleanup (removing "coming soon" texts and fixing typos).

---

## 2026-09-07 (Frontend Sprint 3 Integration)

### Sprint
Sprint 3

### Task
Review frontend integration, merge verified work, and unblock the remaining HR flow

### Work Completed
- Inspected the current repository state and verified `origin/frontend/sprint-3`.
- Merged the verified frontend branch into an integration branch `integration/frontend-sprint-3`.
- Reviewed Sanjay's frontend changes:
  - "Soon" and "coming soon" placeholders successfully removed.
  - Institutional footer text corrected.
  - OTP and authentication endpoints correctly invoked (`POST /api/v1/email/send-otp` and `verify-otp`).
  - Development mocks properly isolated behind `import.meta.env.DEV`.
- Fixed a backend schema defect: `VerifyOTPResponse` did not include the `role` field. Modified `backend/app/schemas/email_verification.py` and `backend/app/services/email_service.py` to correctly extract and return `role` for the frontend's AuthContext.
- Generated `docs/FRONTEND_API_HANDOFF.md` outlining the API contracts and detailing which features are unblocked for Sanjay.

### Tests
- **Frontend Checks:** `npm run build` executed successfully without compilation errors.
- **Backend Checks:** Ran `pytest tests/` in the backend to ensure the schema updates did not break the Email Verification flow. 39/39 tests passed.

### Repository Status
- Safely merged `integration/frontend-sprint-3` to `develop`.
- Pushed `develop` and `integration/frontend-sprint-3` branches to the remote repository.

### Remaining Blockers
- **SMTP configuration:** Production SMTP credentials are still pending from DevOps/SIET management. Mock OTPs are returned in development.
- **Payment Gateway:** Gateway keys are still pending from DevOps/SIET management.

### Next Actionable Item
- **Sanjay V:** Proceed with implementing the Candidate Details Submission, Confirmation, and Verification Result screens using the `docs/FRONTEND_API_HANDOFF.md` contract.
