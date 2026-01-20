-- Migration: Add soft delete support to cases table
-- This migration adds is_deleted and deleted_at columns to track deleted cases

USE ocp_docketing;

-- Add is_deleted column if it doesn't exist
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS is_deleted TINYINT DEFAULT 0;

-- Add deleted_at column if it doesn't exist
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Create an index on is_deleted for faster queries
ALTER TABLE cases 
ADD INDEX IF NOT EXISTS idx_is_deleted (is_deleted);

-- Create an index on deleted_at for sorting deleted cases
ALTER TABLE cases 
ADD INDEX IF NOT EXISTS idx_deleted_at (deleted_at);

-- Verify the migration
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'cases' AND TABLE_SCHEMA = 'ocp_docketing'
ORDER BY ORDINAL_POSITION;
