-- Migration: Add audit trail for tracking who modified records
-- This migration adds created_by and updated_by columns to cases and users tables

USE ocp_docketing;

-- Add audit columns to cases
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS created_by INT AFTER created_at,
ADD COLUMN IF NOT EXISTS updated_by INT AFTER updated_at;

-- Add audit columns to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by INT AFTER created_at,
ADD COLUMN IF NOT EXISTS updated_by INT AFTER updated_at;

-- Add foreign key constraints to cases
ALTER TABLE cases 
ADD CONSTRAINT fk_cases_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE cases 
ADD CONSTRAINT fk_cases_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key constraints to users
ALTER TABLE users 
ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
