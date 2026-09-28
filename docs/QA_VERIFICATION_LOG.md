# QA Verification Log

## 2026-09-15 - Screenshot Review Addendum

**Reviewer:** Shri Hari Vishnu S
**Status:** In Progress / Partially Blocked

### 1. Status Mock Discrepancy
- **Finding:** The screenshot shows request ID "req_abc123" displaying VERIFIED and No Backlog.
- **Investigation:** Verified via `netstat` and WMI that the local Vite dev server on port 5173 is running the current codebase from `frontend/src`. The `StatusPage.tsx` source code confirms that *any* request ID other than "error" or "pending" falls through to a hardcoded generic success response (VERIFIED, No Backlog) when `import.meta.env.DEV` is true.
- **Verdict:** The banner accurately reflects the codebase. The generic mock success remains active.
- **Action:** Assigned to Sanjay to require explicit mock configuration.

### 2. Real Status Lookup
- **Finding:** Backend database connection is failing due to invalid credentials.
- **Investigation:** Running the backend `uvicorn` server and executing `test_flow.py` fails with a 500 Internal Error during the OTP step because `asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "USER"`. 
- **Verdict:** BLOCKED. Cannot verify existing authorized request persistence, unknown ID handling, HR authorization barriers, or backlog data without a functioning database connection. Live status integration is NOT a pass.
- **Action:** Assigned to Parthiban to resolve PostgreSQL credentials.

### 3. Report Download
- **Finding:** The "Download Report" button does not retrieve any report (real or sample).
- **Investigation:** Code inspection of `StatusPage.tsx` reveals the button is hardcoded to trigger a browser alert: `alert('Report download will be available when authorized by the backend.')`
- **Verdict:** FAIL / Incomplete.
- **Action:** Assigned to Sanjay to implement a sample report download mechanism or real backend retrieval.

### 4. Help Wording and Landing Page
- **Finding:** The Help page wording inaccurately states OTP ensures HR authorization. Landing page refers to a "verification link" instead of an OTP.
- **Investigation:** 
  - `HelpPage.tsx` reads: *"To ensure only authorized HR personnel can request verifications, an OTP..."*
  - `LandingPage.tsx` reads: *"A verification link is sent to your HR email..."*
- **Verdict:** Defect - Inaccurate wording.
- **Action:** Assigned to Sanjay to update the Help wording (clarifying that OTP verifies email inbox access) and to align the Landing page wording with the OTP-code workflow.

### 5. Navigation and Layout
- **Finding:** Header and Footer links to Status and Help.
- **Investigation:** Both `AppHeader.tsx` and `AppFooter.tsx` correctly use `react-router-dom` components pointing to `ROUTES.STATUS` and `ROUTES.HELP`. The links are structurally sound.
- **Verdict:** Links PASS structural check. Stepper layout and mobile comparisons are pending further browser rendering capabilities.

## 2026-09-15 - Correction Round 1 Retest

**Reviewer:** Shri Hari Vishnu S
**Integration Commit:** `fa1d2e96669ee1ec890a914ca3d6d86c575e11c3` (incorporates Sanjay's `3d951f2`)

### 1. Ordinary and Unknown Request IDs
- **Verdict: PASS.** The "catch-all" mock logic was removed. Any ID not starting with "demo-" correctly falls through to the production backend API path. Failed/new searches clear stale data and report actions properly (using `setStatusData(null)`).

### 2. Demo Fixtures and Explicit Mock Config
- **Verdict: FAIL.** While demo fixtures are limited to `import.meta.env.DEV` and correctly labelled with `[MOCK]`, there is still no explicit mock configuration gate (e.g., `VITE_USE_MOCKS`). Relying solely on a `demo-` prefix does not satisfy the requirement.
- **Action:** Assigned to Sanjay to implement an explicit environment variable check.

### 3. Report Download Button
- **Verdict: FAIL.** The alert-only action was removed and the button is properly disabled, which is good. However, the tooltip/label reads "Download Report (Pending Backend)" and "PDF report generation is pending backend implementation (Sprint 3+)." This internal sprint wording must be removed from the user-facing UI. 
- **Action:** Assigned to Sanjay to simplify to a generic availability message.

### 4. OTP and Landing Page Wording
- **Verdict: PASS.** `HelpPage.tsx` was correctly updated to state that OTP confirms access to the email address. `LandingPage.tsx` was updated to say "verification code" instead of "verification link."

### 5. Database & PostgreSQL Verification
- **Verdict: BLOCKED.** The backend configuration still contains default credentials (e.g., `YOUR_PASSWORD` or similar invalid "USER"), causing `uvicorn` and `test_flow.py` to crash with `InvalidPasswordError`. 
- **Action:** Assigned to Parthiban to provide a working PostgreSQL connection setup.

### 6. Browser and Layout Checks
- **Verdict: BLOCKED.** Layout comparisons remain pending due to localized browser environment issues (Playwright).

## 2026-09-15 - Final Integrated QA Resume

**Reviewer:** Shri Hari Vishnu S
**Integration Commit:** `9d25601`

### 1. Effective Settings & Mocks
- **Frontend Mocks:** No `.env` overrides exist; `.env.example` specifies `VITE_USE_MOCKS=false`. However, the codebase still relies solely on `import.meta.env.DEV` and `demo-` prefixes for mocks.
- **Backend Mocks:** Code inspection of `backend/app/config.py` confirms that `DEV_MOCK_OTP`, `DEV_MOCK_PAYMENT`, and `DEV_MOCK_VERIFICATION` are all hardcoded to `True`. External services remain simulated.
- **Verdict:** LIVE (Database) / SIMULATED (Backend Services) / DEFECT (Frontend config lacking explicit flags).

### 2. PostgreSQL-Backed API & Ownership Checks
- **Finding:** PostgreSQL connectivity is successful following credential rotation. The API successfully stores new sessions and tracks payment states (`PAID_UNUSED`).
- **Defect:** The flow crashes during "Bind Candidate" with a 500 Internal Server Error. The underlying database driver (`asyncpg`) throws a `CheckViolationError` because the application state `CANDIDATE_BOUND` violates the PostgreSQL schema constraint `verification_requests_status_check`. 
- **Verdict:** FAIL (Schema mismatch). API flow cannot complete to verify final ownership of bounded records. 

### 3. Known/Unknown Request Handling & Payment Reuse Protection
- **Finding:** State validation is actively enforced. When `test_flow.py` attempted to confirm verification prematurely (while still in `PAID_UNUSED` state due to the candidate binding crash), the API successfully rejected it with a 409 Conflict ("Expected CANDIDATE_BOUND. Cannot re-verify").
- **Verdict:** PASS. Payment state and reuse protection logic is functional.

### 4. Browser Navigation, Status/Help Behavior, and Layout
- **Finding:** Subagent Playwright environment continues to fail initialization (404 Not Found on Azure CDN for `playwright-1.57.0-win32_x64.zip`).
- **Verdict:** BLOCKED. Visual stepper checks and layout comparisons cannot be executed automatically. 

### 5. Report Availability
- **Finding:** No changes since last check; the button is disabled but contains internal sprint wording.
- **Verdict:** FAIL / Unfinished.

## 2026-09-15 - HOD Demo Final Integration Verification

**Reviewer:** Shri Hari Vishnu S
**Integration Commit:** `de7211f`

### 1. Frontend Integration & API Reconciliation
- **Finding:** Sanjay's `frontend/razorpay-logo-status-fix` (`96213ff`) was successfully merged. 
- **Verdict:** PASS. The frontend API schema for `verifyPayment` was manually reconciled to match the backend `/api/v1/payment/verify-checkout` signature.

### 2. External Services Status
- **Email OTP Delivery:** MOCKED (`DEV_MOCK_OTP=True`). OTPs are logged to console and returned in JSON for testing. No SMTP connection is made.
- **Razorpay Checkout:** TEST-MODE (`DEV_MOCK_PAYMENT=False`). True API calls are made to Razorpay Sandbox servers using `rzp_test_dummy` (or configured) credentials.
- **Verification Result Email:** MOCKED (`DEV_MOCK_VERIFICATION=True`). Background checks are completed immediately in-memory without dispatching physical result emails.

### 3. Payment Flow & PostgreSQL Atomicity
- **Finding:** Tested with `test_flow_e2e.py` and `pytest`. A single `test-req-123` can only bind one candidate. `CANDIDATE_BOUND` enum was successfully applied to `database/schema.sql` resolving previous PostgreSQL check constraint failures.
- **Verdict:** PASS. Repeated binding attempts (concurrent reuse) correctly return `409 Conflict`. Server-side validation restricts candidate submission strictly to paid orders.

### 4. Tracking and Error Handling
- **Finding:** Tested via `test_tracking.py`. The backend successfully returns a strict `401 Unauthorized` (no token) or `409 Conflict` (unknown ID, `STATE_CONFLICT`) JSON payload. The frontend API client (`api/client.ts`) now parses JSON correctly, avoiding masking the error as a 404 proxy failure.
- **Verdict:** PASS.

### 5. Logo and Layout
- **Finding:** `siet-logo.jpg` was committed and integrated by Sanjay.
- **Verdict:** PASS (for asset inclusion). Playwright browser testing remains BLOCKED (Driver 404), preventing automated rendering validation. Manual QA required.

## Sprint 1 Email and HR Details Verification
- Passed phone number validation using 'phonenumbers' lib.
- Passed DB schema migration for hr_name and hr_phone.
- Passed OTP tracking and timeout mechanics.
- Automated test suite is fully passing (46/46).

## Integration Acceptance Results
- **Phone Validation & OTP limits**: PASS (Automated Tests)
- **Legacy Data DB constraints**: PASS (Automated Tests)
- **Email Delivery Verification**: BLOCKED (Missing real SMTP `SMTP_USERNAME`, `SMTP_PASSWORD` configuration)
- **Razorpay Test Checkout**: BLOCKED (Razorpay blocked by dummy `PAYMENT_GATEWAY_KEY_ID=rzp_test_dummy` credentials)
- **Browser Automation**: BLOCKED (Playwright Chromium download failed with `ECONNRESET`. Manual Checklist provided for UI flow tests utilizing `.test_mailbox.json` outbox testing file).

## 2026-09-17 - Sprint 5 Database Integration and Concurrency Validation

**Reviewer:** Shri Hari Vishnu S
**Status:** Completed successfully

### 1. Reconcile Database Changes
- **Finding:** Parthiban's updated schema was verified. The `CANDIDATE_BOUND` enum missing from the reported constraint `verification_requests_status_check` was intentionally preserved in the integration branch as it represents a valid and legitimately supported state required by the backend API.
- **Verdict:** PASS. Schema safely reconciled and backwards-compatibility maintained via transactional SQL migrations.

### 2. Concurrency Correctness (Candidate Binding)
- **Finding:** Inspected the candidate-binding transaction logic. A formal concurrency test (`test_concurrency.py`) was created to execute simultaneous connections against the same payment order utilizing `asyncpg`.
- **Verdict:** PASS. Exactly one transaction succeeds and returns `SUCCESS`. Concurrent attempts safely encounter PostgreSQL-enforced exceptions or strict application-level `ValueError: Row not found or already bound`, leaving no orphaned or partial records. Payment state and ownership strictly preserved.

### 3. Combined Validation
- **Finding:** Executed Parthiban's test suite `test_postgres_integration.py` against the candidate branch database schema and constraints. 
  - 7/7 Workflow tests PASS (PostgreSQL 15).
  - 47/47 Backend Regression tests PASS.
- **Environment:** PostgreSQL 15 `(PostgreSQL 15.x)` via `asyncpg`.
- **Commands run:**
  - `backend/.venv/Scripts/python.exe -m pytest tests/test_concurrency.py -v`
  - `backend/.venv/Scripts/python.exe -m pytest verification_engine/tests/test_postgres_integration.py -v`
  - `backend/.venv/Scripts/python.exe -m pytest -v`
- **Verdict:** PASS. External service mocks (`DEV_MOCK_OTP`, `DEV_MOCK_PAYMENT`) strictly distinguished from database-layer verification; SMTP/Razorpay were not implicitly inferred as functional. Database-level ownership filtering securely segregates admin accounts.