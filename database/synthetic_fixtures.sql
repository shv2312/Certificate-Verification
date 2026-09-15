-- =============================================================================
-- SIET Academic Background Verification Portal
-- Synthetic Fixtures - Sprint 5 (PostgreSQL Validation)
-- Owner: Parthiban V
-- =============================================================================

-- =============================================================================
-- 1. Multiple HR Owners (For cross-user access denial tests)
-- =============================================================================
INSERT INTO admin_accounts (email, is_active) VALUES 
('hr_a@siet.ac.in', TRUE),
('hr_b@siet.ac.in', TRUE);

-- =============================================================================
-- 2. Synthetic Verification Requests
-- =============================================================================
-- Request 1: Owned by hr_a (Matched candidate test)
INSERT INTO verification_requests (
    id, display_request_id, owner_id, payment_session_id, company_name, hr_email, 
    hr_submitted_name, hr_submitted_register_number, hr_submitted_programme, 
    hr_submitted_branch, hr_submitted_year_of_passing, status, created_at
) VALUES (
    'req_001_match', 'SIET-1001', (SELECT id FROM admin_accounts WHERE email='hr_a@siet.ac.in'), 'pay_001', 'Tech Corp', 'hr_a@siet.ac.in',
    'TEST STUDENT ALPHA', '911021104001', 'BE-CSE', 'CSE', 2024, 'IN_PROGRESS', 1700000000
);

-- Request 2: Owned by hr_b (Mismatch candidate test)
INSERT INTO verification_requests (
    id, display_request_id, owner_id, payment_session_id, company_name, hr_email, 
    hr_submitted_name, hr_submitted_register_number, hr_submitted_programme, 
    hr_submitted_branch, hr_submitted_year_of_passing, status, created_at
) VALUES (
    'req_002_mismatch', 'SIET-1002', (SELECT id FROM admin_accounts WHERE email='hr_b@siet.ac.in'), 'pay_002', 'Global Inc', 'hr_b@siet.ac.in',
    'TEST STUDENT WRONG NAME', '911021104001', 'BE-CSE', 'CSE', 2024, 'IN_PROGRESS', 1700000001
);

-- Request 3: Owned by hr_a (Unknown candidate test)
INSERT INTO verification_requests (
    id, display_request_id, owner_id, payment_session_id, company_name, hr_email, 
    hr_submitted_name, hr_submitted_register_number, hr_submitted_programme, 
    hr_submitted_branch, hr_submitted_year_of_passing, status, created_at
) VALUES (
    'req_003_unknown', 'SIET-1003', (SELECT id FROM admin_accounts WHERE email='hr_a@siet.ac.in'), 'pay_003', 'Tech Corp', 'hr_a@siet.ac.in',
    'UNKNOWN STUDENT', '999999999999', 'BE-CSE', 'CSE', 2024, 'IN_PROGRESS', 1700000002
);

-- Request 4: Owned by hr_b (Duplicate payment scenario - to be tested via Python code simulating failure)
-- The Python test will try to insert a request with payment_session_id = 'pay_001' and expect a UniqueViolation.

-- =============================================================================
-- END OF FIXTURES
-- =============================================================================
