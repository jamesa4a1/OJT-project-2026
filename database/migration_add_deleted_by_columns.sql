-- Migration: Add deleted_by columns to clearances table
-- This migration adds tracking for who deleted clearance records

USE ocp_docketing;

-- Add deleted_by_user_id column if it doesn't exist
ALTER TABLE clearances 
ADD COLUMN IF NOT EXISTS deleted_by_user_id INT NULL COMMENT 'User ID who deleted this record';

-- Add deleted_by_name column if it doesn't exist
ALTER TABLE clearances 
ADD COLUMN IF NOT EXISTS deleted_by_name VARCHAR(255) NULL COMMENT 'Name of user who deleted this record';

-- Add index for deleted_by_user_id for better query performance
ALTER TABLE clearances 
ADD INDEX IF NOT EXISTS idx_deleted_by (deleted_by_user_id);