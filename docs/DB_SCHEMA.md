# Database Schema Reference
## SIET Academic Background Verification Portal — Sprint 1

**Owner**: Parthiban V  
**Last Updated**: 2026-09-02  
**Database**: PostgreSQL 15+

---

## Entity Relationship Overview

```
programmes ──< branches ──< branch_aliases
     │               │
     └───────┬───────┘
             │
          students
             │
             └──< verification_results
                        │
             verification_requests >──┘
               │        │
users ─────────┘   audit_logs
```

---

## Table: `users`

System users (HR or ADMIN). Enforces role-based persistence and ownership for verification requests. Authentication details are handled by FastAPI backend (not stored here).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `email` | VARCHAR(254) | NO | — | **UNIQUE**. Official email. Verified before payment/access. |
| `role` | user_role | NO | — | `HR` or `ADMIN`. Backend enforces authorization. |
| `status` | account_status | NO | `'ACTIVE'` | `ACTIVE` or `DISABLED` |
| `created_at` | TIMESTAMPTZ | NO | NOW() | |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | |

**Indexes**: Unique index on `email`.

---

## Table: `programmes`

Canonical academic programme list. Confirmed values must come from the SIET college registrar.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | SERIAL | NO | auto | Primary key |
| `code` | VARCHAR(20) | NO | — | UNIQUE. Short code e.g. `BE-CSE` |
| `full_name` | VARCHAR(200) | NO | — | UNIQUE. Official full programme name |
| `degree_type` | VARCHAR(50) | NO | — | `B.E.`, `B.Tech`, `M.E.`, `MBA`, `MCA` |
| `is_active` | BOOLEAN | NO | TRUE | FALSE = programme no longer offered |
| `created_at` | TIMESTAMPTZ | NO | NOW() | |

**Indexes**: Primary key on `id`. Unique on `code`, `full_name`.

---

## Table: `branches`

Canonical branch/specialization within a programme.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | SERIAL | NO | auto | Primary key |
| `programme_id` | INTEGER | NO | — | FK → `programmes(id)` RESTRICT |
| `code` | VARCHAR(20) | NO | — | e.g. `CSE`, `ECE`, `MECH` |
| `full_name` | VARCHAR(200) | NO | — | Full official branch name |
| `is_active` | BOOLEAN | NO | TRUE | |
| `created_at` | TIMESTAMPTZ | NO | NOW() | |

**Constraints**: UNIQUE(`programme_id`, `code`).

---

## Table: `branch_aliases`

Approved HR-input shorthand → canonical branch mapping. The **only** approved normalization for branch names.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | SERIAL | NO | Primary key |
| `alias` | VARCHAR(100) | NO | UNIQUE. HR-input string (stored uppercase) |
| `branch_id` | INTEGER | NO | FK → `branches(id)` CASCADE |

**Lookup**: application uppercases HR input → exact key lookup. No fuzzy matching.

---

## Table: `students`

**The source of truth.** Contains official institutional academic records only.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `register_number` | VARCHAR(30) | NO | — | **UNIQUE**. Primary matching key. Strict exact match |
| `full_name` | VARCHAR(200) | NO | — | Official name from institutional records |
| `full_name_normalized` | VARCHAR(200) | NO | — | Uppercase, collapsed whitespace. For comparison only, never displayed |
| `programme_id` | INTEGER | NO | — | FK → `programmes(id)` RESTRICT |
| `branch_id` | INTEGER | NO | — | FK → `branches(id)` RESTRICT |
| `year_of_passing` | SMALLINT | NO | — | CHECK 1990–2100 |
| `university_name` | VARCHAR(200) | NO | `'Anna University'` | |
| `institute_name` | VARCHAR(200) | NO | `'Sri Shakthi...'` | |
| `period_of_study_start` | SMALLINT | YES | NULL | |
| `period_of_study_end` | SMALLINT | YES | NULL | Must be ≥ start if both set |
| `mode_of_education` | VARCHAR(50) | YES | NULL | `Regular`, `Part-Time` |
| `has_arrear` | BOOLEAN | NO | FALSE | |
| `is_active` | BOOLEAN | NO | TRUE | Logical delete flag |
| `imported_at` | TIMESTAMPTZ | NO | NOW() | When record was imported |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | |

**Indexes**: `register_number` (unique), `year_of_passing`, `(programme_id, branch_id)`.

---

## Table: `verification_requests`

One row per payment. Created by Shri Hari's backend after payment confirmation.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `owner_id` | UUID | NO | — | FK → `users(id)` RESTRICT. Enforces strict ownership access control. |
| `payment_id` | UUID | NO | — | **UNIQUE**. Enforces 1-payment-1-request |
| `company_name` | VARCHAR(300) | NO | — | |
| `hr_submitted_name` | VARCHAR(200) | NO | — | Verbatim from HR |
| `hr_submitted_register_number` | VARCHAR(30) | NO | — | Verbatim from HR |
| `hr_submitted_programme` | VARCHAR(100) | NO | — | Verbatim from HR |
| `hr_submitted_branch` | VARCHAR(100) | NO | — | Verbatim from HR |
| `hr_submitted_year_of_passing` | SMALLINT | NO | — | CHECK 1990–2100 |
| `status` | VARCHAR(20) | NO | `'PENDING'` | `PENDING` \| `IN_PROGRESS` \| `VERIFIED` \| `NOT_VERIFIED` \| `ERROR` |
| `created_at` | TIMESTAMPTZ | NO | NOW() | |
| `completed_at` | TIMESTAMPTZ | YES | NULL | Set when verification completes |

---

## Table: `verification_results`

One-to-one with `verification_requests`. Final outcome record.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `request_id` | UUID | NO | — | UNIQUE FK → `verification_requests(id)` |
| `verification_status` | VARCHAR(15) | NO | — | `VERIFIED` or `NOT_VERIFIED` only |
| `student_id` | BIGINT | YES | NULL | FK → `students(id)`. NULL on NOT_VERIFIED (no leakage) |
| `verified_at` | TIMESTAMPTZ | NO | NOW() | |
| `engine_version` | VARCHAR(20) | NO | `'1.0'` | |

**Constraint**: `student_id IS NOT NULL` when `VERIFIED`; `student_id IS NULL` when `NOT_VERIFIED`.

---

## Table: `audit_logs`

Append-only event ledger. Structure owned by Parthiban; event generation owned by Shri Hari's backend.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | BIGSERIAL | NO | Primary key |
| `event_type` | VARCHAR(60) | NO | See event types below |
| `request_id` | UUID | YES | FK → `verification_requests(id)` SET NULL |
| `actor` | VARCHAR(100) | YES | `system`, hashed HR ref, `admin` — no raw PII |
| `event_metadata` | JSONB | YES | Safe structured data. No student record values |
| `created_at` | TIMESTAMPTZ | NO | Indexed DESC |

**Approved event types**:
- `EMAIL_VERIFIED`
- `PAYMENT_CONFIRMED`
- `VERIFICATION_REQUEST_CREATED`
- `VERIFICATION_STARTED`
- `VERIFICATION_SUCCEEDED`
- `VERIFICATION_FAILED`
- `REPORT_GENERATED`
- `REPORT_SENT`
- `ERROR`

---

## Security Notes

- App user (`siet_app_user`) has SELECT/INSERT/UPDATE only. No DROP, no DDL, no DELETE on `audit_logs`.
- No credentials in source files. Use `.env` (gitignored).
- Real student data is never committed to git.
- All queries must use parameterized statements — no string interpolation.
