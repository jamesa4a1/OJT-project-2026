-- Migration to add is_active column to users table
-- Run this SQL in phpMyAdmin or MySQL CLI

USE ocp_docketing;

-- Add is_active column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT DEFAULT 1;

-- Update existing users to be active by default
UPDATE users SET is_active = 1 WHERE is_active IS NULL;
