-- Migration: Add performance indexes to frequently queried columns
-- This migration adds indexes for optimized query performance

USE ocp_docketing;

-- Add indexes to users table
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_role (role),
ADD INDEX IF NOT EXISTS idx_is_active (is_active),
ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Add indexes to cases table
ALTER TABLE cases 
ADD INDEX IF NOT EXISTS idx_docket_no (DOCKET_NO),
ADD INDEX IF NOT EXISTS idx_date_filed (DATE_FILED),
ADD INDEX IF NOT EXISTS idx_date_resolved (DATE_RESOLVED),
ADD INDEX IF NOT EXISTS idx_complainant (COMPLAINANT),
ADD INDEX IF NOT EXISTS idx_respondent (RESPONDENT),
ADD INDEX IF NOT EXISTS idx_offense (OFFENSE),
ADD INDEX IF NOT EXISTS idx_created_at (created_at),
ADD INDEX IF NOT EXISTS idx_is_deleted_created (is_deleted, created_at);

