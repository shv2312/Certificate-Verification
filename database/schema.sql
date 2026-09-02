-- =============================================================================
-- SIET Academic Background Verification Portal
-- PostgreSQL Database Schema — Sprint 1
-- Owner: Parthiban V (Database, Verification Engine & Deployment Lead)
-- Date: 2026-09-02
-- =============================================================================
-- IMPORTANT:
--   Run this script against a fresh PostgreSQL database.
--   Required extension: pgcrypto (for gen_random_uuid()).
--   Command: psql -U <superuser> -d siet_verification -f schema.sql
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('HR', 'ADMIN');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'DISABLED');

-- =============================================================================
-- 0. USERS (HR & ADMIN Accounts)
--    Enforces role-based persistence and ownership for verification requests.
--    Authentication details are handled by FastAPI backend (not stored here).
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(254)   NOT NULL UNIQUE,
    role        user_role      NOT NULL,
    status      account_status NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users        IS 'System users (HR or ADMIN). Authentication managed by backend.';
COMMENT ON COLUMN users.email  IS 'Official email. Verified before payment/access.';
COMMENT ON COLUMN users.role   IS 'HR or ADMIN. Backend enforces authorization based on this.';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================================
-- 1. PROGRAMMES
--    Canonical list of academic programmes offered at SIET.
--    Official values must be confirmed with the college registrar.
--    Current entries are structural placeholders.
-- =============================================================================
CREATE TABLE IF NOT EXISTS programmes (
    id          SERIAL      PRIMARY KEY,
    code        VARCHAR(20) NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    degree_type VARCHAR(50)  NOT NULL,   -- e.g. 'B.E.', 'B.Tech', 'M.E.', 'MBA'
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT programmes_code_unique     UNIQUE (code),
    CONSTRAINT programmes_fullname_unique UNIQUE (full_name)
);

COMMENT ON TABLE  programmes            IS 'Canonical academic programme/course list. Source: SIET Registrar.';
COMMENT ON COLUMN programmes.code       IS 'Short code used internally and in normalization. e.g. CSE, ECE, MECH.';
COMMENT ON COLUMN programmes.full_name  IS 'Full official programme name as registered with Anna University.';
COMMENT ON COLUMN programmes.degree_type IS 'Degree classification. e.g. B.E., B.Tech, M.E., MBA, MCA.';

-- =============================================================================
-- 2. BRANCHES
--    Canonical branch / specialization within a programme.
--    A branch belongs to one programme (e.g. CSE under B.E.).
-- =============================================================================
CREATE TABLE IF NOT EXISTS branches (
    id           SERIAL       PRIMARY KEY,
    programme_id INTEGER      NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
    code         VARCHAR(20)  NOT NULL,
    full_name    VARCHAR(200) NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT branches_programme_code_unique UNIQUE (programme_id, code)
);

COMMENT ON TABLE  branches              IS 'Canonical branch/specialization within a programme.';
COMMENT ON COLUMN branches.programme_id IS 'Parent programme.';
COMMENT ON COLUMN branches.code         IS 'Short branch code. e.g. CSE, ECE, MECH.';
COMMENT ON COLUMN branches.full_name    IS 'Full official branch name.';

-- =============================================================================
-- 3. BRANCH ALIASES
--    Maps common HR-entered shorthand/variations → canonical branch_id.
--    This is the ONLY approved normalization mechanism for branch/programme.
--    No fuzzy matching is used.
-- =============================================================================
CREATE TABLE IF NOT EXISTS branch_aliases (
    id        SERIAL       PRIMARY KEY,
    alias     VARCHAR(100) NOT NULL,
    branch_id INTEGER      NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    CONSTRAINT branch_aliases_alias_unique UNIQUE (alias)
);

COMMENT ON TABLE  branch_aliases.alias     IS 'Exact string that HR might type (case-insensitive lookup in application layer).';
COMMENT ON TABLE  branch_aliases           IS 'Approved alias → canonical branch mapping. Fuzzy matching is NOT used.';

-- =============================================================================
-- 4. STUDENTS
--    The official institutional student record.
--    This is the SOURCE OF TRUTH for all verifications.
--    IMPORTANT: Only authorized/official data from the college registrar
--               may be inserted here. No fabricated real-world records.
-- =============================================================================
CREATE TABLE IF NOT EXISTS students (
    id                    BIGSERIAL    PRIMARY KEY,
    register_number       VARCHAR(30)  NOT NULL,
    full_name             VARCHAR(200) NOT NULL,
    -- Normalized form used for matching only (never exposed externally).
    -- Computed by the application layer during import: trimmed, collapsed
    -- whitespace, uppercased. Used for comparison, not display.
    full_name_normalized  VARCHAR(200) NOT NULL,
    programme_id          INTEGER      NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
    branch_id             INTEGER      NOT NULL REFERENCES branches(id)   ON DELETE RESTRICT,
    year_of_passing       SMALLINT     NOT NULL,
    university_name       VARCHAR(200) NOT NULL DEFAULT 'Anna University',
    institute_name        VARCHAR(200) NOT NULL DEFAULT 'Sri Shakthi Institute of Engineering and Technology',
    -- Optional extended fields (nullable until official data is provided)
    period_of_study_start SMALLINT     NULL,
    period_of_study_end   SMALLINT     NULL,
    mode_of_education     VARCHAR(50)  NULL,    -- e.g. 'Regular', 'Part-Time'
    has_arrear            BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Record lifecycle
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    imported_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- -------------------------------------------------------------------------
    -- CONSTRAINTS
    -- -------------------------------------------------------------------------
    -- Register number is the primary candidate identifier.
    -- Must be unique and cannot be NULL.
    CONSTRAINT students_register_number_unique UNIQUE (register_number),

    -- Year of passing must be a plausible academic year.
    -- Lower bound: SIET was established. Upper bound: 2100 for future safety.
    -- Do NOT hard-code a narrow range that breaks for new batches.
    CONSTRAINT students_year_of_passing_range
        CHECK (year_of_passing BETWEEN 1990 AND 2100),

    CONSTRAINT students_period_study_valid
        CHECK (
            (period_of_study_start IS NULL AND period_of_study_end IS NULL)
            OR (period_of_study_start IS NOT NULL AND period_of_study_end IS NOT NULL
                AND period_of_study_end >= period_of_study_start)
        )
);

COMMENT ON TABLE  students                       IS 'Official SIET student academic records. Source of truth. Only authorized institutional data.';
COMMENT ON COLUMN students.register_number       IS 'Official university register/roll number. Primary matching key. Strict exact match only.';
COMMENT ON COLUMN students.full_name             IS 'Official name as per institutional records.';
COMMENT ON COLUMN students.full_name_normalized  IS 'Application-computed normalized form (trimmed, collapsed spaces, uppercased). Used for comparison ONLY. Never returned to HR.';
COMMENT ON COLUMN students.year_of_passing       IS 'Academic year in which the student completed the programme.';
COMMENT ON COLUMN students.has_arrear            IS 'Whether the student has/had any outstanding examination arrears.';
COMMENT ON COLUMN students.is_active             IS 'FALSE if a record is logically deleted/superseded.';

-- Indexes for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_students_register_number    ON students (register_number);
CREATE INDEX IF NOT EXISTS idx_students_year_of_passing    ON students (year_of_passing);
CREATE INDEX IF NOT EXISTS idx_students_programme_branch   ON students (programme_id, branch_id);

-- =============================================================================
-- 5. VERIFICATION REQUESTS
--    Created by Shri Hari's backend when a payment is confirmed.
--    Parthiban designs the structure; backend populates it.
--    One payment → exactly one verification request (enforced by UNIQUE
--    constraint on payment_id).
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
    id                              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Ownership link to HR user
    owner_id                        UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    -- CRITICAL: UNIQUE enforces one-payment-one-request at database level.
    -- payment_id format/lifecycle must be confirmed with Shri Hari's backend.
    payment_id                      UUID         NOT NULL,
    company_name                    VARCHAR(300) NOT NULL,

    -- HR-submitted candidate details (stored verbatim before normalization)
    hr_submitted_name               VARCHAR(200) NOT NULL,
    hr_submitted_register_number    VARCHAR(30)  NOT NULL,
    hr_submitted_programme          VARCHAR(100) NOT NULL,
    hr_submitted_branch             VARCHAR(100) NOT NULL,
    hr_submitted_year_of_passing    SMALLINT     NOT NULL,

    -- Request lifecycle
    -- Possible values: PENDING, IN_PROGRESS, VERIFIED, NOT_VERIFIED, ERROR
    status                          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at                    TIMESTAMPTZ  NULL,

    CONSTRAINT verification_requests_payment_unique UNIQUE (payment_id),
    CONSTRAINT verification_requests_status_check
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'NOT_VERIFIED', 'ERROR')),
    CONSTRAINT verification_requests_year_range
        CHECK (hr_submitted_year_of_passing BETWEEN 1990 AND 2100)
);

COMMENT ON TABLE  verification_requests                           IS 'One verification request per payment. Created by Shri Hari backend after payment confirmation.';
COMMENT ON COLUMN verification_requests.owner_id                 IS 'HR user who created this request. Enforces strict ownership access control.';
COMMENT ON COLUMN verification_requests.payment_id               IS 'FK to payment system (managed by Shri Hari backend). UNIQUE ensures one-payment-one-request.';
COMMENT ON COLUMN verification_requests.hr_submitted_name        IS 'Verbatim name as entered by HR. Stored for audit. Normalization happens in the engine.';
COMMENT ON COLUMN verification_requests.hr_submitted_register_number IS 'Verbatim register number as entered by HR.';
COMMENT ON COLUMN verification_requests.status                   IS 'PENDING|IN_PROGRESS|VERIFIED|NOT_VERIFIED|ERROR';

CREATE INDEX IF NOT EXISTS idx_vreq_owner_id    ON verification_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_vreq_payment_id  ON verification_requests (payment_id);
CREATE INDEX IF NOT EXISTS idx_vreq_status      ON verification_requests (status);

-- =============================================================================
-- 6. VERIFICATION RESULTS
--    One-to-one with verification_requests.
--    Stores the final outcome. student_id is NULL on NOT_VERIFIED (no leakage).
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_results (
    id                  BIGSERIAL    PRIMARY KEY,
    request_id          UUID         NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    verification_status VARCHAR(15)  NOT NULL,
    -- student_id is populated ONLY when verification_status = 'VERIFIED'.
    -- It is NULL on NOT_VERIFIED to avoid leaking any student record reference.
    student_id          BIGINT       NULL REFERENCES students(id) ON DELETE RESTRICT,
    verified_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- Engine version for future auditability / reproducibility tracking.
    engine_version      VARCHAR(20)  NOT NULL DEFAULT '1.0',

    CONSTRAINT verification_results_request_unique UNIQUE (request_id),
    CONSTRAINT verification_results_status_check
        CHECK (verification_status IN ('VERIFIED', 'NOT_VERIFIED')),
    -- If VERIFIED, student_id must be set. If NOT_VERIFIED, student_id must be NULL.
    CONSTRAINT verification_results_student_consistency
        CHECK (
            (verification_status = 'VERIFIED'     AND student_id IS NOT NULL)
            OR
            (verification_status = 'NOT_VERIFIED' AND student_id IS NULL)
        )
);

COMMENT ON TABLE  verification_results                    IS 'Final outcome of a verification request. One row per request.';
COMMENT ON COLUMN verification_results.verification_status IS 'VERIFIED or NOT_VERIFIED only. Never exposes which field failed.';
COMMENT ON COLUMN verification_results.student_id         IS 'Populated only on VERIFIED. NULL on NOT_VERIFIED to prevent data leakage.';
COMMENT ON COLUMN verification_results.engine_version     IS 'Version of the verification engine used. For audit/reproducibility.';

CREATE INDEX IF NOT EXISTS idx_vres_request_id ON verification_results (request_id);

-- =============================================================================
-- 7. AUDIT LOGS
--    Append-only event ledger for all significant system events.
--    Structure owned by Parthiban; event-generation logic owned by Shri Hari.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id            BIGSERIAL    PRIMARY KEY,
    event_type    VARCHAR(60)  NOT NULL,
    request_id    UUID         NULL REFERENCES verification_requests(id) ON DELETE SET NULL,
    actor         VARCHAR(100) NULL,   -- e.g. 'system', 'hr:<email_hash>', 'admin'
    -- JSONB for flexible structured metadata.
    -- IMPORTANT: Do NOT store sensitive personal data or student record
    --            values in metadata. Store only safe, non-leaking identifiers.
    event_metadata JSONB       NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_logs                IS 'Append-only audit event log. Records significant system events for compliance and debugging.';
COMMENT ON COLUMN audit_logs.event_type     IS 'One of: EMAIL_VERIFIED, PAYMENT_CONFIRMED, VERIFICATION_REQUEST_CREATED, VERIFICATION_STARTED, VERIFICATION_SUCCEEDED, VERIFICATION_FAILED, REPORT_GENERATED, REPORT_SENT, ERROR.';
COMMENT ON COLUMN audit_logs.actor          IS 'Who triggered the event. Use hashed/opaque identifiers. Do NOT store raw personal data.';
COMMENT ON COLUMN audit_logs.event_metadata IS 'Safe structured metadata (JSONB). Must NOT contain student academic details or mismatch information.';

-- Audit logs are almost always queried by time range or event type.
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type  ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id  ON audit_logs (request_id);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
