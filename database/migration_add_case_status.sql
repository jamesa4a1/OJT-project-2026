-- Migration: Add case status tracking
-- This migration adds a status column to track the workflow state of cases

USE ocp_docketing;

-- Add case status column
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS status ENUM('Filed', 'Under Investigation', 'Pending Decision', 'Resolved', 'Archived', 'Dismissed') DEFAULT 'Filed'
AFTER DATE_RESOLVED;

-- Create index on status for efficient filtering
ALTER TABLE cases 
ADD INDEX IF NOT EXISTS idx_status (status);
