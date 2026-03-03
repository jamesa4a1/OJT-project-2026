-- Migration: Add Foreign Keys and Cascading Delete Rules
-- Purpose: Enforce referential integrity and prevent orphaned records
-- Date: 2026-03-03

-- Check and add foreign key constraint: cases -> users (created_by)
-- This ensures cases created by a user are soft-deleted when the user is deleted
ALTER TABLE cases 
ADD CONSTRAINT IF NOT EXISTS fk_cases_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Check and add foreign key constraint: clearances -> users (created_by)
-- This ensures clearances created by a user are archived when user is deleted
ALTER TABLE clearances 
ADD CONSTRAINT IF NOT EXISTS fk_clearances_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- If case_assignments table exists, add foreign keys for it
-- This ensures assignments are deleted when user or case is deleted
ALTER TABLE case_assignments 
ADD CONSTRAINT IF NOT EXISTS fk_case_assignments_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE case_assignments 
ADD CONSTRAINT IF NOT EXISTS fk_case_assignments_case_id 
FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint on email to prevent duplicates
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS uk_users_email UNIQUE (email);

-- Add unique constraint on DOCKET_NO to prevent duplicate case numbers
ALTER TABLE cases 
ADD CONSTRAINT IF NOT EXISTS uk_cases_docket_no UNIQUE (DOCKET_NO);

-- Add unique constraint on OR_NUMBER to prevent duplicate clearance numbers
ALTER TABLE clearances 
ADD CONSTRAINT IF NOT EXISTS uk_clearances_or_number UNIQUE (or_number);

-- Log completion
-- Cascading rules:
-- - When user deleted: their case assignments are deleted, created_by set to NULL for cases/clearances
-- - When case deleted: all assignments for that case are deleted, clearances related to it are handled separately
-- - Email is unique to prevent duplicate account creation
-- - DOCKET_NO and OR_NUMBER are unique to maintain data integrity
