# Backend ↔ Database Integration Contract
## SIET Academic Background Verification Portal

**Version:** Sprint 1  
**Backend:** Shri Hari Vishnu S (FastAPI, Python)  
**Database / Verification Engine:** Parthiban V (PostgreSQL, Python)

---

> [!IMPORTANT]
> This document defines the integration contract between Shri Hari's FastAPI
> backend and Parthiban's PostgreSQL database and verification engine.
> Neither side should create duplicate structures for the other's domain.

---

## Ownership Boundaries

| Domain | Owner | Technologies |
|--------|-------|--------------|
| API layer, business logic, request lifecycle | Shri Hari | FastAPI, Python |
| Student records, verification engine, database schema, migrations | Parthiban | PostgreSQL, Python, Alembic |
| Frontend | Sanjay | React, TypeScript, Vite |

---

## Database Connection

The backend connects to Parthiban's PostgreSQL via:

```
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE
```

Set in `backend/.env` (never committed to Git).

**Session management:** `backend/app/db/session.py`  
Async SQLAlchemy engine + `get_db` dependency for routes/services.

**ORM base:** `backend/app/db/session.py:Base`  
Only for backend-specific tables (see below). Student/verification tables belong to Parthiban.

---

## Tables Owned by Each Party

### Parthiban's Tables (do NOT touch from backend code)

| Table | Purpose |
|-------|---------|
| `students` (or equivalent) | Student academic records |
| `verification_engine_*` | Verification logic and results storage |

Shri Hari must NOT:
- Create migration files for Parthiban's tables
- Define SQLAlchemy ORM models for student data
- Query the students table directly outside the agreed function interface

### Shri Hari's Tables (Sprint 2 — when in-process stores are migrated to DB)

These will be defined in `backend/app/db/models.py` once the database is wired in:

| Table | Purpose |
|-------|---------|
| `email_challenges` | OTP challenges (currently in-process) |
| `payment_sessions` | Payment state (currently in-process) |
| `verification_requests` | Request lifecycle (currently in-process) |

---

## Verification Engine Interface

### Required Function

Parthiban must provide a callable with this signature:

```python
async def verify_candidate(
    candidate_name: str,
    register_number: str,
    course: str,
    branch: str,
    year_of_passing: int,
) -> VerificationResult:
    ...
```

### Return Type

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class VerificationResult:
    status: str  # "VERIFIED" | "NOT_VERIFIED"

    # Populated only when status == "VERIFIED"
    # ALL values must come from authoritative institutional DB records.
    # NEVER fabricate or default these values.
    candidate_name: Optional[str] = None
    university_name: Optional[str] = None
    institute_name: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    register_number: Optional[str] = None
    year_of_passing: Optional[int] = None
    backlog_status: Optional[str] = None
    period_of_study: Optional[str] = None
    mode_of_education: Optional[str] = None
```

### Matching Logic Rules

- The engine must NOT raise an exception for a "not found" / no-match case.
  It should return `VerificationResult(status="NOT_VERIFIED")`.
- The engine MUST raise an exception for actual DB errors (connection issues, etc.)
  so the backend can return a 500/503 response.
- Matching logic (fuzzy, exact, case-insensitive) is Parthiban's responsibility.
- The backend passes the raw submitted values; the engine decides whether they match.

### Integration Location

The integration will be implemented in:

```
backend/app/services/verification_service.py
  └── _call_verification_engine()   ← Replace NotImplementedError stub here
```

---

## Concurrency Enforcement

**Requirement:** Two simultaneous requests must NOT be able to bind two different
candidates to the same paid verification request.

**Backend enforcement (current, Sprint 1):** In-process state machine with
status checks in `verification_service.bind_candidate()`.

**Database enforcement (required for production):**

Parthiban must design the verification_requests table such that:

1. The `verification_request_id` has a **UNIQUE constraint** in its binding relationship
   to the candidate.
2. The transition from `PAID_UNUSED` → `CANDIDATE_BOUND` uses an **atomic UPDATE
   with a WHERE status = 'PAID_UNUSED'** guard.
3. A second concurrent request attempting the same bind will fail at the DB level
   (row lock or constraint violation).

Example atomic bind pattern:
```sql
UPDATE verification_requests
SET status = 'CANDIDATE_BOUND', candidate_data = :candidate
WHERE id = :request_id
  AND status = 'PAID_UNUSED'
RETURNING id;
-- If 0 rows returned → reject with 409 CONFLICT
```

---

## Request Lifecycle States

The following states must be consistent between backend and database.
**Do NOT change state names without informing the team.**

```
EMAIL_NOT_VERIFIED
      ↓
EMAIL_OTP_SENT
      ↓
EMAIL_VERIFIED
      ↓
PAYMENT_PENDING
      ↓
PAID_UNUSED
      ↓
CANDIDATE_BOUND
      ↓
VERIFICATION_IN_PROGRESS
      ↓
VERIFIED | NOT_VERIFIED
      ↓
COMPLETED
```

---

## Audit Events

The backend will eventually emit the following audit events to Parthiban's
audit log table (or a shared audit service):

| Event | Trigger |
|-------|---------|
| `EMAIL_OTP_SENT` | send-otp called |
| `EMAIL_VERIFIED` | verify-otp succeeds |
| `PAYMENT_INITIATED` | payment/initiate called |
| `PAYMENT_CONFIRMED` | webhook received and verified |
| `VERIFICATION_REQUEST_CREATED` | After payment confirmed |
| `CANDIDATE_BOUND` | bind-candidate succeeds |
| `VERIFICATION_STARTED` | confirm called |
| `VERIFICATION_SUCCEEDED` | Engine returns VERIFIED |
| `VERIFICATION_FAILED` | Engine returns NOT_VERIFIED |
| `REPORT_GENERATED` | Report PDF created |
| `REPORT_SENT` | Report emailed to HR |

**Do NOT log:** candidate PAN, contact details, full student record.
**DO log:** request ID, timestamp, event type, company name (masked HR email).

---

## Current Blockers

| Item | Blocked on | Action needed |
|------|------------|---------------|
| Verification engine | Parthiban's implementation | Parthiban to provide `verify_candidate()` and its module path |
| Student schema | Parthiban's DB design | Parthiban to share table definitions |
| In-process → PostgreSQL migration | Parthiban's table definitions | Shri Hari to create `email_challenges`, `payment_sessions`, `verification_requests` tables |
| Concurrency guarantee | Database atomic update design | Parthiban to implement and confirm UNIQUE + WHERE-guard pattern |

---

## Action Items (Sprint 2 Integration Checklist)

- [ ] Parthiban: Share `verify_candidate()` function/module
- [ ] Parthiban: Share table definitions for student records
- [ ] Parthiban: Implement UNIQUE + atomic bind constraint
- [ ] Shri Hari: Replace `_call_verification_engine()` stub
- [ ] Shri Hari: Replace in-process stores with PostgreSQL models
- [ ] Both: Run end-to-end test with real DB
- [ ] Shri Hari: Add database health check to `/api/health`
