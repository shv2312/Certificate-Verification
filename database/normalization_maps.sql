-- =============================================================================
-- SIET Academic Background Verification Portal
-- Branch & Programme Normalization Maps — Sprint 1
-- Owner: Parthiban V
-- Date: 2026-09-02
-- =============================================================================
-- PURPOSE:
--   Inserts canonical programme and branch records, and approved alias
--   mappings. This allows the verification engine to translate HR-entered
--   shorthand (e.g. "CSE") into the correct canonical branch_id without
--   fuzzy matching.
--
-- IMPORTANT:
--   The exact list of SIET programmes and branches must be officially
--   confirmed with the college registrar / HOD.
--   Current entries are STRUCTURAL PLACEHOLDERS based on common engineering
--   college offerings. They must be replaced with verified institutional data
--   before going to production.
--
-- RUN AFTER: schema.sql
-- =============================================================================

-- =============================================================================
-- PROGRAMMES (Canonical)
-- These must match the official Anna University programme codes for SIET.
-- =============================================================================
INSERT INTO programmes (code, full_name, degree_type) VALUES
    ('BE-CSE',   'Computer Science and Engineering',                  'B.E.'),
    ('BE-ECE',   'Electronics and Communication Engineering',         'B.E.'),
    ('BE-EEE',   'Electrical and Electronics Engineering',            'B.E.'),
    ('BE-MECH',  'Mechanical Engineering',                            'B.E.'),
    ('BE-CIVIL', 'Civil Engineering',                                 'B.E.'),
    ('BE-IT',    'Information Technology',                            'B.E.'),
    ('BE-AUTO',  'Automobile Engineering',                            'B.E.'),
    ('ME-CSE',   'Computer Science and Engineering (Post Graduate)',   'M.E.'),
    ('ME-VLSI',  'VLSI Design',                                       'M.E.'),
    ('MBA',      'Master of Business Administration',                 'MBA'),
    ('MCA',      'Master of Computer Applications',                   'MCA')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- BRANCHES (Canonical — one per programme for UG; specializations for PG)
-- =============================================================================
-- B.E. CSE
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'CSE', 'Computer Science and Engineering'
FROM programmes WHERE code = 'BE-CSE'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. ECE
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'ECE', 'Electronics and Communication Engineering'
FROM programmes WHERE code = 'BE-ECE'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. EEE
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'EEE', 'Electrical and Electronics Engineering'
FROM programmes WHERE code = 'BE-EEE'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. Mechanical
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'MECH', 'Mechanical Engineering'
FROM programmes WHERE code = 'BE-MECH'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. Civil
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'CIVIL', 'Civil Engineering'
FROM programmes WHERE code = 'BE-CIVIL'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. IT
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'IT', 'Information Technology'
FROM programmes WHERE code = 'BE-IT'
ON CONFLICT (programme_id, code) DO NOTHING;

-- B.E. Automobile
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'AUTO', 'Automobile Engineering'
FROM programmes WHERE code = 'BE-AUTO'
ON CONFLICT (programme_id, code) DO NOTHING;

-- M.E. CSE
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'CSE', 'Computer Science and Engineering'
FROM programmes WHERE code = 'ME-CSE'
ON CONFLICT (programme_id, code) DO NOTHING;

-- M.E. VLSI
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'VLSI', 'VLSI Design'
FROM programmes WHERE code = 'ME-VLSI'
ON CONFLICT (programme_id, code) DO NOTHING;

-- MBA
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'MBA', 'Master of Business Administration'
FROM programmes WHERE code = 'MBA'
ON CONFLICT (programme_id, code) DO NOTHING;

-- MCA
INSERT INTO branches (programme_id, code, full_name)
SELECT id, 'MCA', 'Master of Computer Applications'
FROM programmes WHERE code = 'MCA'
ON CONFLICT (programme_id, code) DO NOTHING;

-- =============================================================================
-- BRANCH ALIASES
--   Maps HR-entered text (case-insensitive in app layer) → branch_id.
--   Only approved, safe, exact aliases are listed here.
--   Fuzzy/phonetic matching is NOT used.
--
-- NOTE: Aliases are stored in the preferred HR-input form.
--       The application layer will UPPER() the HR input before lookup.
-- =============================================================================

-- CSE aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('CSE'),
    ('COMPUTER SCIENCE AND ENGINEERING'),
    ('COMPUTER SCIENCE'),
    ('CS AND E'),
    ('B.E. CSE'),
    ('BE CSE')
) AS a(alias)
JOIN branches b ON b.code = 'CSE'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-CSE'
ON CONFLICT (alias) DO NOTHING;

-- ECE aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('ECE'),
    ('ELECTRONICS AND COMMUNICATION ENGINEERING'),
    ('ELECTRONICS AND COMMUNICATION'),
    ('E AND CE'),
    ('B.E. ECE'),
    ('BE ECE')
) AS a(alias)
JOIN branches b ON b.code = 'ECE'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-ECE'
ON CONFLICT (alias) DO NOTHING;

-- EEE aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('EEE'),
    ('ELECTRICAL AND ELECTRONICS ENGINEERING'),
    ('ELECTRICAL AND ELECTRONICS'),
    ('E AND EE'),
    ('B.E. EEE'),
    ('BE EEE')
) AS a(alias)
JOIN branches b ON b.code = 'EEE'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-EEE'
ON CONFLICT (alias) DO NOTHING;

-- MECH aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('MECH'),
    ('MECHANICAL ENGINEERING'),
    ('MECHANICAL'),
    ('B.E. MECH'),
    ('BE MECH')
) AS a(alias)
JOIN branches b ON b.code = 'MECH'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-MECH'
ON CONFLICT (alias) DO NOTHING;

-- CIVIL aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('CIVIL'),
    ('CIVIL ENGINEERING'),
    ('B.E. CIVIL'),
    ('BE CIVIL')
) AS a(alias)
JOIN branches b ON b.code = 'CIVIL'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-CIVIL'
ON CONFLICT (alias) DO NOTHING;

-- IT aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('IT'),
    ('INFORMATION TECHNOLOGY'),
    ('INFO TECH'),
    ('B.E. IT'),
    ('BE IT')
) AS a(alias)
JOIN branches b ON b.code = 'IT'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-IT'
ON CONFLICT (alias) DO NOTHING;

-- AUTO aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('AUTO'),
    ('AUTOMOBILE ENGINEERING'),
    ('AUTOMOBILE'),
    ('B.E. AUTO'),
    ('BE AUTO')
) AS a(alias)
JOIN branches b ON b.code = 'AUTO'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'BE-AUTO'
ON CONFLICT (alias) DO NOTHING;

-- MBA aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('MBA'),
    ('MASTER OF BUSINESS ADMINISTRATION'),
    ('BUSINESS ADMINISTRATION')
) AS a(alias)
JOIN branches b ON b.code = 'MBA'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'MBA'
ON CONFLICT (alias) DO NOTHING;

-- MCA aliases
INSERT INTO branch_aliases (alias, branch_id)
SELECT a.alias, b.id
FROM (VALUES
    ('MCA'),
    ('MASTER OF COMPUTER APPLICATIONS'),
    ('COMPUTER APPLICATIONS')
) AS a(alias)
JOIN branches b ON b.code = 'MCA'
JOIN programmes p ON p.id = b.programme_id AND p.code = 'MCA'
ON CONFLICT (alias) DO NOTHING;

-- =============================================================================
-- END OF NORMALIZATION MAPS
-- =============================================================================
