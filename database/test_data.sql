-- =============================================================================
-- SIET Academic Background Verification Portal
-- Test / Sample Data — Sprint 1
-- Owner: Parthiban V
-- Date: 2026-09-02
-- =============================================================================
-- WARNING:
--   ALL RECORDS IN THIS FILE ARE ENTIRELY FICTIONAL.
--   These are NOT real students.
--   Register numbers, names and details are invented purely for testing.
--   Do NOT use real student names, register numbers, or personal data.
--   This file must NEVER be run in a production environment.
--
-- RUN AFTER: schema.sql AND normalization_maps.sql
-- =============================================================================

-- =============================================================================
-- FICTIONAL TEST STUDENTS
-- Clearly labelled as TEST STUDENT to avoid any confusion.
-- =============================================================================

INSERT INTO students (
    register_number,
    full_name,
    full_name_normalized,
    programme_id,
    branch_id,
    year_of_passing,
    period_of_study_start,
    period_of_study_end,
    mode_of_education,
    has_arrear
)
SELECT
    '911021104001',
    'TEST STUDENT ALPHA',
    'TEST STUDENT ALPHA',
    p.id,
    b.id,
    2024,
    2020, 2024,
    'Regular',
    FALSE
FROM programmes p
JOIN branches b ON b.programme_id = p.id AND b.code = 'CSE'
WHERE p.code = 'BE-CSE';

INSERT INTO students (
    register_number,
    full_name,
    full_name_normalized,
    programme_id,
    branch_id,
    year_of_passing,
    period_of_study_start,
    period_of_study_end,
    mode_of_education,
    has_arrear
)
SELECT
    '911021104002',
    'TEST STUDENT BETA',
    'TEST STUDENT BETA',
    p.id,
    b.id,
    2024,
    2020, 2024,
    'Regular',
    FALSE
FROM programmes p
JOIN branches b ON b.programme_id = p.id AND b.code = 'ECE'
WHERE p.code = 'BE-ECE';

INSERT INTO students (
    register_number,
    full_name,
    full_name_normalized,
    programme_id,
    branch_id,
    year_of_passing,
    period_of_study_start,
    period_of_study_end,
    mode_of_education,
    has_arrear
)
SELECT
    '911021104003',
    'TEST STUDENT GAMMA',
    'TEST STUDENT GAMMA',
    p.id,
    b.id,
    2023,
    2019, 2023,
    'Regular',
    TRUE
FROM programmes p
JOIN branches b ON b.programme_id = p.id AND b.code = 'MECH'
WHERE p.code = 'BE-MECH';

INSERT INTO students (
    register_number,
    full_name,
    full_name_normalized,
    programme_id,
    branch_id,
    year_of_passing,
    period_of_study_start,
    period_of_study_end,
    mode_of_education,
    has_arrear
)
SELECT
    '911021104004',
    'TEST STUDENT DELTA',
    'TEST STUDENT DELTA',
    p.id,
    b.id,
    2022,
    2018, 2022,
    'Regular',
    FALSE
FROM programmes p
JOIN branches b ON b.programme_id = p.id AND b.code = 'EEE'
WHERE p.code = 'BE-EEE';

INSERT INTO students (
    register_number,
    full_name,
    full_name_normalized,
    programme_id,
    branch_id,
    year_of_passing,
    period_of_study_start,
    period_of_study_end,
    mode_of_education,
    has_arrear
)
SELECT
    '911021104005',
    'TEST STUDENT EPSILON',
    'TEST STUDENT EPSILON',
    p.id,
    b.id,
    2021,
    2017, 2021,
    'Regular',
    FALSE
FROM programmes p
JOIN branches b ON b.programme_id = p.id AND b.code = 'IT'
WHERE p.code = 'BE-IT';

-- =============================================================================
-- FICTIONAL TEST USERS (HR & ADMIN)
-- =============================================================================
INSERT INTO users (id, email, role, status) VALUES 
('cccccccc-0000-0000-0000-000000000001', 'test.hr@testcompany.example', 'HR', 'ACTIVE'),
('dddddddd-0000-0000-0000-000000000001', 'admin.test@siet.ac.in', 'ADMIN', 'ACTIVE');

-- =============================================================================
-- FICTIONAL TEST VERIFICATION REQUEST (for integration testing)
-- Uses a fake payment UUID.
-- Status manually set to PENDING.
-- =============================================================================
INSERT INTO verification_requests (
    id,
    owner_id,
    payment_id,
    company_name,
    hr_submitted_name,
    hr_submitted_register_number,
    hr_submitted_programme,
    hr_submitted_branch,
    hr_submitted_year_of_passing,
    status
) VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Test Company Pvt Ltd',
    'TEST STUDENT ALPHA',
    '911021104001',
    'BE-CSE',
    'CSE',
    2024,
    'PENDING'
);

-- =============================================================================
-- AUDIT LOG entries for the test request
-- =============================================================================
INSERT INTO audit_logs (event_type, request_id, actor, event_metadata)
VALUES (
    'VERIFICATION_REQUEST_CREATED',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'system',
    '{"source": "test_data", "note": "fictional test record"}'
);

-- =============================================================================
-- END OF TEST DATA
-- =============================================================================
