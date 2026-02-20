-- Migration: Create terminated_cases table
-- This creates a separate table for terminated cases instead of using soft deletes

USE ocp_docketing;

-- Create terminated_cases table with same structure as cases table
CREATE TABLE IF NOT EXISTS terminated_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DOCKET_NO VARCHAR(255) NOT NULL UNIQUE,
  DATE_FILED DATE,
  COMPLAINANT VARCHAR(255),
  RESPONDENT VARCHAR(255),
  ADDRESS_OF_RESPONDENT TEXT,
  OFFENSE VARCHAR(255),
  DATE_OF_COMMISSION DATE,
  DATE_RESOLVED DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  RESOLVING_PROSECUTOR VARCHAR(255),
  CRIM_CASE_NO VARCHAR(255),
  BRANCH VARCHAR(255),
  DATEFILED_IN_COURT VARCHAR(255),
  REMARKS_DECISION TEXT,
  PENALTY TEXT,
  INDEX_CARDS VARCHAR(255),
  
  -- Additional columns for tracking termination
  terminated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  terminated_by_user_id INT,
  terminated_by_name VARCHAR(255),
  termination_reason VARCHAR(255) DEFAULT 'Case Terminated',
  
  -- Original tracking columns
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  
  -- Indexes for better performance
  INDEX idx_docket_no (DOCKET_NO),
  INDEX idx_terminated_at (terminated_at),
  INDEX idx_terminated_by (terminated_by_user_id),
  INDEX idx_status (status)
);

-- Remove old soft delete columns from cases table (optional - for cleanup)
-- Uncomment these lines if you want to remove the old soft delete columns
-- ALTER TABLE cases DROP COLUMN IF EXISTS is_deleted;
-- ALTER TABLE cases DROP COLUMN IF EXISTS deleted_at;

-- Create audit log for case movements
CREATE TABLE IF NOT EXISTS case_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  docket_no VARCHAR(255) NOT NULL,
  movement_type ENUM('TERMINATED', 'RESTORED', 'PERMANENTLY_DELETED') NOT NULL,
  moved_from_table VARCHAR(50),
  moved_to_table VARCHAR(50),
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moved_by_user_id INT,
  moved_by_name VARCHAR(255),
  reason VARCHAR(255),
  
  INDEX idx_docket_movement (docket_no),
  INDEX idx_movement_type (movement_type),
  INDEX idx_moved_at (moved_at)
);

-- Migrate existing soft-deleted cases to terminated_cases table
INSERT INTO terminated_cases (
  DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT, 
  OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
  CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
  INDEX_CARDS, terminated_at, created_at, created_by, updated_at, updated_by
)
SELECT 
  DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
  OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
  CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
  INDEX_CARDS, 
  COALESCE(deleted_at, updated_at) as terminated_at,
  created_at, created_by, updated_at, updated_by
FROM cases 
WHERE is_deleted = 1;

-- Log the migration
INSERT INTO case_movements (docket_no, movement_type, moved_from_table, moved_to_table, reason)
SELECT DOCKET_NO, 'TERMINATED', 'cases', 'terminated_cases', 'Migration from soft delete'
FROM cases 
WHERE is_deleted = 1;

-- Remove migrated cases from cases table
DELETE FROM cases WHERE is_deleted = 1;

-- Verify the migration
SELECT 
  (SELECT COUNT(*) FROM cases) as active_cases,
  (SELECT COUNT(*) FROM terminated_cases) as terminated_cases,
  (SELECT COUNT(*) FROM case_movements) as movement_logs;