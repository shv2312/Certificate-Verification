-- Migration: 001_add_hr_details.sql
-- Description: Adds mandatory HR details (name and phone) for Sprint 1

ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS hr_name VARCHAR(255) NULL;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS hr_phone VARCHAR(50) NULL;

ALTER TABLE email_challenges ADD COLUMN IF NOT EXISTS hr_name VARCHAR(255) NULL;
ALTER TABLE email_challenges ADD COLUMN IF NOT EXISTS hr_phone VARCHAR(50) NULL;
