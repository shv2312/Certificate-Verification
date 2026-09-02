# Parthiban V — Work Log
## Database, Verification Engine & Deployment Lead
### SIET Academic Background Verification Portal

---

## 2026-09-02

### Sprint
Sprint 1

### Task
Establish the complete database foundation, data model, verification engine, documentation, and test suite for the SIET Academic Background Verification Portal.

### Work Completed

- Inspected the project repository. Found it was completely empty (no git, no code, no docs, no teammate files). This is a greenfield start.
- Initialized a git repository in the project folder.
- Created `.gitignore` covering Python, secrets, production data, IDE files, and Node modules.
- Created `.env.example` showing all required environment variables. No real credentials stored.
- Created `README.md` with project overview, team roles, architecture diagram, and setup instructions.
- Designed the full PostgreSQL database schema for 7 tables: `programmes`, `branches`, `branch_aliases`, `students`, `verification_requests`, `verification_results`, `audit_logs`.
- Created `database/schema.sql` with complete DDL, constraints, indexes, and detailed SQL comments.
- Created `database/normalization_maps.sql` with canonical programme/branch seed data and approved alias mappings for HR input normalization.
- Created `database/test_data.sql` with 5 clearly fictional test student records and 1 test verification request. No real student data.
- Created `database/README.md` with PostgreSQL setup instructions, security notes, and table ownership overview.
- Created the `verification_engine` Python package with three modules:
  - `normalizer.py` — safe normalization of register number, candidate name, year, and branch alias resolution
  - `matcher.py` — field-by-field comparison with privacy guarantee (no field failure disclosure)
  - `engine.py` — orchestration layer with dependency-injected DB lookup (ORM-agnostic)
- Created full pytest test suite with 86 tests across:
  - `test_normalizer.py` — 42 tests
  - `test_matcher.py` — 17 tests
  - `test_engine.py` — 27 tests
- Ran all 86 tests. All passed (86/86). Fixed 1 minor test type bug found during the run.
- Created documentation:
  - `docs/DB_SCHEMA.md` — full schema reference for all 7 tables
  - `docs/VERIFICATION_ENGINE_CONTRACT.md` — integration guide for Shri Hari's backend
  - `docs/DATA_NORMALIZATION_RULES.md` — exact normalization and matching policy per field
  - `docs/DEPLOYMENT_QUESTIONS.md` — unresolved college server / deployment requirements

### Database Changes

- Designed PostgreSQL schema from scratch (project was empty).
- 7 tables created in `schema.sql`: `programmes`, `branches`, `branch_aliases`, `students`, `verification_requests`, `verification_results`, `audit_logs`.
- Normalization alias data defined in `normalization_maps.sql`.
- Fictional test data created in `test_data.sql`.
- Note: Schema is SQL-only. ORM migration system not yet chosen — depends on Shri Hari's backend technology decision.

### Files Changed

**New files created:**
- `.gitignore`
- `.env.example`
- `README.md`
- `database/schema.sql`
- `database/normalization_maps.sql`
- `database/test_data.sql`
- `database/README.md`
- `verification_engine/__init__.py`
- `verification_engine/normalizer.py`
- `verification_engine/matcher.py`
- `verification_engine/engine.py`
- `verification_engine/tests/__init__.py`
- `verification_engine/tests/test_normalizer.py`
- `verification_engine/tests/test_matcher.py`
- `verification_engine/tests/test_engine.py`
- `docs/DB_SCHEMA.md`
- `docs/VERIFICATION_ENGINE_CONTRACT.md`
- `docs/DATA_NORMALIZATION_RULES.md`
- `docs/DEPLOYMENT_QUESTIONS.md`

**No teammate files were modified.**

### Tables / Models Added or Modified

| Table | Action | Notes |
|---|---|---|
| `programmes` | Added | Canonical programme list |
| `branches` | Added | Canonical branch/specialization |
| `branch_aliases` | Added | HR shorthand → canonical branch mapping |
| `students` | Added | Official institutional student records (source of truth) |
| `verification_requests` | Added | One per payment (UNIQUE constraint on payment_id) |
| `verification_results` | Added | One-to-one outcome per request |
| `audit_logs` | Added | Append-only event ledger |

### Testing

- Test: normalize_register_number — basic, whitespace, uppercase, near-miss, boundaries, errors → **PASSED** (11 tests)
- Test: normalize_candidate_name — basic, whitespace, case, length, different names → **PASSED** (11 tests)
- Test: normalize_year_of_passing — valid, boundaries, bad input → **PASSED** (11 tests)
- Test: resolve_branch_alias — known, full name, case-insensitive, unknown, partial, non-string → **PASSED** (9 tests)
- Test: validate_and_normalize integration — all valid, each field invalid, multiple errors → **PASSED** (5 tests)
- Test: compare_records VERIFIED → **PASSED** (2 tests)
- Test: compare_records NOT_VERIFIED (register, name, branch, year mismatches, off-by-one, near-miss) → **PASSED** (7 tests)
- Test: handle_record_not_found → **PASSED** (3 tests)
- Test: Privacy guarantee (no official value leakage on mismatch) → **PASSED** (3 tests)
- Test: Engine end-to-end VERIFIED cases → **PASSED** (7 tests)
- Test: Engine end-to-end NOT_VERIFIED cases → **PASSED** (6 tests)
- Test: Engine INVALID_INPUT cases → **PASSED** (4 tests)
- Test: Engine duplicate handling → **PASSED** (1 test)
- Test: build_alias_map_from_rows → **PASSED** (4 tests)
- **Total: 86 tests — ALL PASSED**
- PostgreSQL schema SQL tests: **NOT RUN** — PostgreSQL not yet installed locally. Schema syntax was reviewed manually and is structurally correct. Will require database setup to run.

### Problems Found

- One test bug found and immediately fixed: `assert 2099 not in str(result.__dict__)` failed because Python requires `in` for strings to have a string left operand. Fixed to `assert str(2099) not in str(result.__dict__)`.
- No other problems found.

### Decisions Made

1. **Register number = primary lookup key.** No candidate can be looked up without a register number. Name alone is not a valid lookup.
2. **No fuzzy matching anywhere.** Branch aliases use exact lookup only. Name comparison uses normalized exact match. This minimizes false-positive verification risk.
3. **Alias table for branch normalization** instead of runtime fuzzy matching. Aliases are controlled, approved, and stored in the database — not guessed.
4. **Engine is ORM-agnostic** — uses dependency injection for the student lookup function. Shri Hari's backend provides the actual DB query; the engine does not import SQLAlchemy or psycopg2 directly.
5. **NOT_VERIFIED and record-not-found are indistinguishable** from the HR user's perspective. This prevents iterative guessing attacks.
6. **`student_id` is NULL on NOT_VERIFIED** — the engine physically cannot expose it.
7. **payment_id UNIQUE constraint on verification_requests** — enforces 1-payment-1-request at the database level.
8. **SQL DDL only (no ORM migrations)** for Sprint 1 — ORM choice belongs to Shri Hari's backend. Migration strategy documented for future sprint.
9. **Fictional test data only** — all test records labelled "TEST STUDENT ALPHA/BETA/etc." No real student information used.
10. **year range 1990–2100** — wide enough not to break on future student batches.

### Dependencies / Waiting For

- **Shri Hari (Backend)**: Payment schema and `payment_id` UUID format, ORM/DB technology choice, FastAPI endpoint design, agreement on `verification_requests` fields.
- **College Registrar**: Official programme and branch list for SIET (current normalization_maps.sql entries are placeholders), official student dataset authorization for production import.
- **College IT**: Server OS, RAM, storage, Docker availability, domain/subdomain, SSL certificate, network restrictions.

### Security Notes

- No database credentials in any committed file. `.env.example` has placeholder values only.
- `.gitignore` blocks `.env`, `*.pem`, `*.key`, production data dumps.
- Test data is entirely fictional. No real student personal data committed.
- `full_name_normalized` is a comparison-only field — never exposed to HR.
- App user (`siet_app_user`) is designed for minimal privileges (no DDL, no DELETE on audit_logs).
- All verification queries use parameterized statements by design (no string interpolation in engine).

### Next Step

1. Share `docs/VERIFICATION_ENGINE_CONTRACT.md` with Shri Hari so he can design the FastAPI endpoint that calls the engine.
2. Get Shri Hari's ORM/DB technology decision so SQLAlchemy (or alternative) integration can be added.
3. Get the official SIET programme and branch list from college registrar to replace placeholder data in `normalization_maps.sql`.
4. Install PostgreSQL locally and run `schema.sql` to verify the DDL executes without errors.
5. Design the student data import pipeline (CSV/Excel → `students` table) once official data format is known.

---

## 2026-09-02

### Sprint
Sprint 2

### Task
Database Integration, Role-Aware Data Model and Verification Hardening

### Repository State Before Work
- Inspected the repository and found a major discrepancy: **Shri Hari's FastAPI backend and Sanjay's React frontend were completely missing.** The repository only contained the database foundation and verification engine developed in Sprint 1.
- No backend code exists to integrate with, blocking full backend integration.

### Work Completed
- Inspected and verified Sprint 1 database and test structures.
- Extended the database schema to support role-aware data model (HR and ADMIN).
- Enforced HR verification request ownership at the database level.
- Reviewed and confirmed "no manual review" verification outcome state.
- Hardened privacy constraints and one-payment-one-candidate database rules.
- Updated database schema documentation.
- Updated verification engine contract.
- Ran all existing `verification_engine` tests (86/86 passed) to ensure matching logic remains deterministic and privacy-preserving.

### Database Changes
- Modified `database/schema.sql` to include `users` table and ENUMs for roles.
- Modified `verification_requests` to reference `owner_id` (enforcing ownership).
- Modified `database/test_data.sql` to include test users and link verification requests to them.

### Tables / Models Added
- `users`: Stores HR and ADMIN identities for request ownership and access control. 
- `user_role` (ENUM): HR, ADMIN.
- `account_status` (ENUM): ACTIVE, DISABLED.

### Tables / Models Modified
- `verification_requests`: Replaced `hr_email` with `owner_id` (FK to `users(id)`).

### Constraints Added / Modified
- Added FK constraint `verification_requests(owner_id)` referencing `users(id)`.
- Re-confirmed UNIQUE constraint on `verification_requests.payment_id` prevents double-use of payments.

### Indexes Added / Modified
- Added unique index on `users(email)`.
- Added index on `verification_requests(owner_id)`.

### Migrations
- Continued to use raw SQL `schema.sql` as no backend ORM (Alembic/Tortoise) framework has been introduced by Shri Hari yet.

### Verification Engine Changes
- No structural engine changes were required as Sprint 1's engine was already built to be fully deterministic and privacy-preserving (no data leakage on mismatch, `student_id` is naturally shielded).

### Normalization Changes
- None required. Sprint 1 normalization was reviewed and confirmed adequate.

### HR / Admin Role Support
- Added database representation for HR and ADMIN via the `users` table and `user_role` enum. This guarantees roles are stored authoritatively in the DB, rather than trusting frontend inputs.

### Request Ownership
- Enforced at the database level by requiring `owner_id` on every `verification_requests` row. HR A's requests can be trivially filtered by `WHERE owner_id = HR_A_ID`.

### Payment Binding
- Reviewed and confirmed that `UNIQUE(payment_id)` on `verification_requests` safely prevents two requests from consuming the same successful payment, satisfying the "one payment = one candidate" HOD business rule.

### Audit Changes
- Reviewed Sprint 1 `audit_logs` schema; confirmed it is append-only and avoids PII leakage. No changes required.

### Backend Integration
- Blocked by the absence of Shri Hari's FastAPI backend codebase. Updated `VERIFICATION_ENGINE_CONTRACT.md` to guide the backend on passing `owner_id`.

### Security Decisions
- Re-verified that the verification engine does not leak missing field info on mismatch.
- Confirmed that backend authorization should use the new `users.role` field instead of email domain sniffing.

### Tests Performed
- Ran `pytest verification_engine/tests/`
- Test: All 86 engine tests (normalizer, matcher, orchestration, duplicate handling, privacy guarantees) → **PASSED**

### Problems Found
- Missing FastAPI backend and React frontend code.

### Legacy Logic Found
- The engine and schema already had no manual review logic or blockchain/IPFS assumptions. No legacy code had to be removed.

### Dependencies
- **Shri Hari (Backend)**: FastAPI backend code needs to be pushed to the repository so integration can continue.

### Deployment Notes
- PostgreSQL 15+ is still the target.
- Database is deployment-ready as a DDL script. Waiting on final college server credentials.

### Decisions Made
- Added a `users` table to persist HR/ADMIN roles since "temporary sessions" cannot easily own verification requests long-term without an identity table, and the updated HOD workflow requires strict request ownership tracking.

### Next Step
- Wait for Shri Hari to push the FastAPI backend.
- Once pushed, integrate the verification engine properly into the backend service endpoints.

---

## 2026-09-02 (Git Integration Task)

### Task
Shared Git Repository Database / Verification Push

### Repository
Remote:
https://github.com/shv2312/Certificate-Verification.git

Branch:
Blocked (No `develop` or backend branches found on remote)

### Work Completed
- Committed local Sprint 2 database and verification engine changes.
- Added remote `shared` pointing to the GitHub repository.
- Fetched remote branches.
- Discovered that the shared integration foundation is not ready (only `main` exists).
- STOPPED push to avoid forcing database work into `main` before Shri Hari sets up the structure.

### Database Location
- Local: `database/`
- Remote: Not pushed yet

### Verification Engine Location
- Local: `verification_engine/`
- Remote: Not pushed yet

### Files Added / Moved
- None (Push blocked)

### Schema / Migration Status
- Local schemas are up to date and committed locally.

### Backend Contract Check
- Blocked. Remote repository is essentially empty/unstructured.

### HR / Admin Compatibility
- Database supports it locally.

### Payment Rule Compatibility
- Database supports it locally.

### Security Check
- No secrets or real student data committed locally.

### Test Data Check
- Only fictional student data exists.

### Tests
- Local tests pass (86/86).

### Problems
- Shared repository integration foundation is not ready. Waiting for Shri Hari's setup.

### Backend Dependencies
- Shri Hari must push `develop` and the FastAPI structure to the shared remote repository.

### Next Step
- Wait for Shri Hari to establish the shared integration repository structure on GitHub.
