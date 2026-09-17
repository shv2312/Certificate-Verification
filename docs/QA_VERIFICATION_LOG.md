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
# #   S p r i n t   1   E m a i l   a n d   H R   D e t a i l s   V e r i f i c a t i o n  
 -   P a s s e d   p h o n e   n u m b e r   v a l i d a t i o n   u s i n g   ' p h o n e n u m b e r s '   l i b .  
 -   P a s s e d   D B   s c h e m a   m i g r a t i o n   f o r   h r _ n a m e   a n d   h r _ p h o n e .  
 -   P a s s e d   O T P   t r a c k i n g   a n d   t i m e o u t   m e c h a n i c s .  
 -   A u t o m a t e d   t e s t   s u i t e   i s   f u l l y   p a s s i n g   ( 4 6 / 4 6 ) .  
 # #   I n t e g r a t i o n   A c c e p t a n c e   R e s u l t s  
 -   P h o n e   V a l i d a t i o n   &   O T P   l i m i t s :   P A S S   ( A u t o m a t e d   T e s t s )  
 -   L e g a c y   D a t a   D B   c o n s t r a i n t s :   P A S S   ( A u t o m a t e d   T e s t s )  
 -   E m a i l   D e l i v e r y   V e r i f i c a t i o n :   B L O C K E D   ( P e n d i n g   r e a l   S M T P   c o n f i g )  
 -   R a z o r p a y   T e s t   C h e c k o u t :   B L O C K E D   ( B r o w s e r   U I   t e s t   p e n d i n g   d u e   t o   O T P   m e m o r y   r e s t r i c t i o n )  
 