# Verification Engine — API Contract
## SIET Academic Background Verification Portal — Sprint 1

**Owner**: Parthiban V  
**Consumer**: Shri Hari Vishnu S (FastAPI Backend)  
**Date**: 2026-09-02  
**Engine Version**: 1.0

---

## Overview

The verification engine is a pure Python library called by Shri Hari's FastAPI backend. It takes HR-submitted candidate data and returns a verification outcome (VERIFIED or NOT_VERIFIED). It does not handle HTTP, payments, email, or report generation — those belong to the backend.

---

## Integration Pattern

```python
from verification_engine.engine import VerificationEngine, VerificationRequest, build_alias_map_from_rows
from verification_engine.matcher import StudentRecord

# --- Step 1: Build alias map (load from DB at startup or cache it) ---
alias_rows = db.execute("SELECT ba.alias, ba.branch_id, b.full_name AS branch_full_name "
                        "FROM branch_aliases ba JOIN branches b ON b.id = ba.branch_id "
                        "WHERE b.is_active = TRUE")
alias_map = build_alias_map_from_rows(alias_rows)

# --- Step 2: Define a student lookup function using your DB session ---
def student_lookup(register_number: str):
    row = db.execute(
        "SELECT id, register_number, full_name_normalized, branch_id, year_of_passing "
        "FROM students WHERE register_number = %s AND is_active = TRUE",
        (register_number,)
    ).fetchone()
    if row is None:
        return None
    return StudentRecord(
        student_id=row.id,
        register_number=row.register_number,
        full_name_normalized=row.full_name_normalized,
        branch_id=row.branch_id,
        year_of_passing=row.year_of_passing,
    )

# --- Step 3: Create engine instance ---
engine = VerificationEngine(alias_map=alias_map, student_lookup_fn=student_lookup)

# --- Step 4: Verify a candidate ---
request = VerificationRequest(
    request_id="<verification_requests.id UUID>",
    register_number="<HR submitted>",
    candidate_name="<HR submitted>",
    branch="<HR submitted>",
    year_of_passing="<HR submitted>",
)
outcome = engine.verify(request)
```

---

## Input: `VerificationRequest`

| Field | Type | Description |
|---|---|---|
| `request_id` | `str` | UUID from `verification_requests.id` |
| `register_number` | `str` | Raw register number from HR |
| `candidate_name` | `str` | Raw candidate name from HR |
| `branch` | `str` | Raw branch/specialization from HR |
| `year_of_passing` | `int` or `str` | Year from HR (normalized internally) |

---

## Output: `VerificationOutcome`

| Field | Type | Description |
|---|---|---|
| `request_id` | `str` | Echoed from input |
| `status` | `str` | `"VERIFIED"` \| `"NOT_VERIFIED"` \| `"INVALID_INPUT"` |
| `student_id` | `int` or `None` | Set **only** when `status == "VERIFIED"`. Use to fetch authorized report data from `students` table |
| `errors` | `list[ValidationError]` | Non-empty **only** when `status == "INVALID_INPUT"`. Never contains mismatch detail |
| `engine_version` | `str` | Always `"1.0"` for Sprint 1 |

---

## Status Meanings

| Status | Meaning | Backend Action |
|---|---|---|
| `VERIFIED` | All submitted fields match official record | Generate report, send to HR email |
| `NOT_VERIFIED` | Register not found OR one/more fields mismatch | Return "verification unsuccessful" to HR. No detail about which field failed |
| `INVALID_INPUT` | Input failed pre-DB validation (empty field, unknown branch, bad year) | Return 400-level error to HR. Do NOT record a verification attempt |

---

## Privacy Guarantees

1. `NOT_VERIFIED` never reveals which field failed.
2. `NOT_VERIFIED` never reveals the official database value for any field.
3. `student_id` is `None` on `NOT_VERIFIED` — backend must not look up student record for failed verifications.
4. The HR interface should display only: *"Verification unsuccessful. One or more submitted details could not be verified against institutional records."*

---

## Backend Responsibilities (Shri Hari)

1. **Before calling the engine**: 
   - Confirm payment is consumed.
   - Insert `verification_requests` row ensuring `owner_id` is set to the authenticated HR user's `id`.
   - Update `verification_requests.status = 'IN_PROGRESS'`.
2. **After calling the engine**:
   - Insert a row into `verification_results` with `verification_status` and `student_id`.
   - Update `verification_requests.status` and `completed_at`.
   - Insert an `audit_logs` row (`VERIFICATION_SUCCEEDED` or `VERIFICATION_FAILED`).
3. **On VERIFIED only**: Fetch authorized display fields from `students` using `student_id` for report generation. Do NOT expose `full_name_normalized` or any internal DB columns in the report.
4. **On NOT_VERIFIED**: Return generic failure message. Do NOT expose any student record information.

---

## Authorized Student Fields for Reports (VERIFIED only)

When generating the official verification report, the backend may fetch the following fields from `students` using `student_id`:

- `full_name` (display name — NOT `full_name_normalized`)
- `register_number`
- `university_name`
- `institute_name`
- Programme and branch via `programme_id` / `branch_id` JOIN
- `year_of_passing`
- `period_of_study_start`, `period_of_study_end`
- `mode_of_education`

> Fields to be included in the official report must be confirmed with the HOD.

---

## Open Dependencies (Sprint 1)

| Dependency | Owner | Status |
|---|---|---|
| FastAPI endpoint design | Shri Hari | 🔴 Open |
| Payment schema / `payment_id` UUID format | Shri Hari | 🔴 Open |
| ORM / DB session technology | Shri Hari | 🔴 Open |
| Role/Auth model backend integration | Shri Hari | 🔴 Open (Missing backend implementation) |
| Official student dataset | College Registrar | 🔴 Open |
| Official programme/branch list | College Registrar | Placeholders in place |
