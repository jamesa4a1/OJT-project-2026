-- Migration: Add case assignment tracking
-- This migration creates a table to track which staff members are assigned to which cases

USE ocp_docketing;

-- Create case assignments table
CREATE TABLE IF NOT EXISTS case_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT NOT NULL,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unassigned_at TIMESTAMP NULL DEFAULT NULL,
  is_active TINYINT DEFAULT 1,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_case_id (case_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_active_assignment (case_id, assigned_to, is_active)
);

-- Verify the migration
SHOW TABLES LIKE 'case_assignments';
