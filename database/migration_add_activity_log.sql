-- Migration: Add activity log table for audit trail
-- This migration creates a detailed log of all actions performed on cases and users

USE ocp_docketing;

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entity_type ENUM('case', 'user', 'assignment') NOT NULL,
  entity_id INT NOT NULL,
  action ENUM('created', 'updated', 'deleted', 'restored', 'assigned', 'unassigned', 'status_changed', 'login', 'logout') NOT NULL,
  old_values JSON DEFAULT NULL,
  new_values JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- Verify the migration
SHOW TABLES LIKE 'activity_log';
