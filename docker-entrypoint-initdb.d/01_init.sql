-- =====================================================
-- COMBINED DATABASE INITIALIZATION SCRIPT
-- =====================================================
-- All tables created with their FINAL schema (no ALTER needed).
-- For Docker MySQL fresh initialization.
-- =====================================================

USE ocp_docketing;

-- =====================================================
-- STEP 1: Create users table (with all columns)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Clerk', 'Staff') DEFAULT 'Clerk',
  profile_picture VARCHAR(500) DEFAULT NULL,
  is_active TINYINT DEFAULT 1,
  last_login TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  INDEX idx_role (role),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);

-- =====================================================
-- STEP 2: Create cases table (with all columns)
-- =====================================================

CREATE TABLE IF NOT EXISTS cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DOCKET_NO VARCHAR(255) UNIQUE NOT NULL,
    DATE_FILED DATE,
  COMPLAINANT VARCHAR(255) NOT NULL,
  RESPONDENT VARCHAR(255) NOT NULL,
  ADDRESS_OF_RESPONDENT VARCHAR(500) DEFAULT '',
  OFFENSE VARCHAR(255) NOT NULL,
  FINAL_OFFENSE VARCHAR(255) DEFAULT NULL,
  DATE_OF_COMMISSION DATE,
  DATE_RESOLVED DATE,
    status VARCHAR(50) DEFAULT NULL,
  RESOLVING_PROSECUTOR VARCHAR(255),
  CRIM_CASE_NO VARCHAR(255),
  BRANCH VARCHAR(255),
    DATEFILED_IN_COURT MEDIUMTEXT DEFAULT NULL,
  REMARKS_DECISION TEXT,
  PENALTY VARCHAR(255),
  DECISION_DATE DATE NULL DEFAULT NULL,
  MR_FILED_BY VARCHAR(1000) DEFAULT NULL,
  DATE_MR_FILING VARCHAR(100) DEFAULT NULL,
  DATE_MR_RESOLVED VARCHAR(100) DEFAULT NULL,
  MR_FINDING VARCHAR(255) DEFAULT NULL,
  INDEX_CARDS VARCHAR(500),
  is_deleted TINYINT DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  INDEX idx_docket_no (DOCKET_NO),
  INDEX idx_date_filed (DATE_FILED),
  INDEX idx_date_resolved (DATE_RESOLVED),
  INDEX idx_complainant (COMPLAINANT),
  INDEX idx_respondent (RESPONDENT),
  INDEX idx_offense (OFFENSE),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_cases_created_at (created_at),
  INDEX idx_is_deleted_created (is_deleted, created_at)
);

-- =====================================================
-- STEP 3: Create terminated_cases table
-- =====================================================

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
  DECISION_DATE DATE NULL DEFAULT NULL,
  MR_FILED_BY VARCHAR(1000) DEFAULT NULL,
  DATE_MR_FILING VARCHAR(100) DEFAULT NULL,
  DATE_MR_RESOLVED VARCHAR(100) DEFAULT NULL,
  MR_FINDING VARCHAR(255) DEFAULT NULL,
  INDEX_CARDS VARCHAR(255),
  terminated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  terminated_by_user_id INT,
  terminated_by_name VARCHAR(255),
  termination_reason VARCHAR(255) DEFAULT 'Case Terminated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  INDEX idx_docket_no (DOCKET_NO),
  INDEX idx_terminated_at (terminated_at),
  INDEX idx_terminated_by (terminated_by_user_id),
  INDEX idx_status (status)
);

-- =====================================================
-- STEP 4: Create case_movements table
-- =====================================================

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

-- =====================================================
-- STEP 5: Create activity_log table
-- =====================================================

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

-- =====================================================
-- STEP 6: Create case_assignments table
-- =====================================================

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

-- =====================================================
-- STEP 7: Create clearances table
-- =====================================================

CREATE TABLE IF NOT EXISTS clearances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    or_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Official Receipt Number',
    format_type ENUM('A', 'B', 'C', 'D') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    alias VARCHAR(255),
    age INT NOT NULL,
    civil_status ENUM('Single', 'Married', 'Widow', 'Widower', 'Separated', 'Divorced') NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Filipino',
    address TEXT NOT NULL,
    has_criminal_record BOOLEAN DEFAULT FALSE,
    case_numbers VARCHAR(255),
    crime_description TEXT,
    legal_statute VARCHAR(255),
    date_of_commission DATE,
    date_information_filed DATE,
    case_status ENUM('Pending in Court', 'Pending with Prosecutor', 'Dismissed', 'Convicted', 'Acquitted', 'Referred to Other Agency', 'Other'),
    court_branch VARCHAR(100),
    purpose VARCHAR(255) NOT NULL,
    purpose_fee DECIMAL(10, 2) DEFAULT 0.00,
    issued_upon_request_by VARCHAR(255),
    date_issued DATE NOT NULL,
    prc_id_number VARCHAR(50),
    validity_period ENUM('6 Months', '1 Year') DEFAULT '6 Months',
    validity_expiry DATE NOT NULL,
    issued_by_user_id INT NOT NULL,
    issued_by_name VARCHAR(255) NOT NULL,
    status ENUM('Valid', 'Expired', 'Revoked', 'Cancelled') DEFAULT 'Valid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    deleted_by_user_id INT NULL,
    deleted_by_name VARCHAR(255) NULL,
    INDEX idx_or_number (or_number),
    INDEX idx_applicant_name (last_name, first_name),
    INDEX idx_date_issued (date_issued),
    INDEX idx_status (status),
    INDEX idx_format_type (format_type),
    INDEX idx_has_criminal_record (has_criminal_record),
    INDEX idx_issued_by (issued_by_user_id),
    INDEX idx_deleted_by (deleted_by_user_id),
    FOREIGN KEY (issued_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clearance_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clearance_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'DOWNLOAD', 'PRINT', 'REVOKE') NOT NULL,
    action_by_user_id INT NOT NULL,
    action_by_name VARCHAR(255) NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_clearance_id (clearance_id),
    INDEX idx_action (action),
    INDEX idx_action_date (created_at),
    FOREIGN KEY (clearance_id) REFERENCES clearances(id) ON DELETE CASCADE,
    FOREIGN KEY (action_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clearance_or_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    last_sequence INT DEFAULT 0,
    UNIQUE KEY unique_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO clearance_or_sequence (year, last_sequence) VALUES (YEAR(CURRENT_DATE), 8254600);

CREATE TABLE IF NOT EXISTS clearance_purposes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purpose_name VARCHAR(255) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO clearance_purposes (purpose_name, fee, sort_order) VALUES
('Local Employment', 50.00, 1),
('Foreign Employment', 100.00, 2),
('Foreign Travel', 200.00, 3),
('Firearm License', 1000.00, 4),
('Permit to Carry Firearm', 500.00, 5),
('Business Permit', 300.00, 6),
('Retirement/Resignation', 100.00, 7),
('Certification of No Pending Case', 75.00, 8),
('Promotion', 0.00, 9),
('Probation', 0.00, 10),
('Plea Bargaining Agreement', 0.00, 11),
('For Family Verification', 0.00, 12),
('For Adoption Proceedings', 0.00, 13),
('Other', 0.00, 99);

-- =====================================================
-- STEP 8: Security audit tables
-- =====================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity ENUM('INFO', 'WARN', 'HIGH', 'CRITICAL') DEFAULT 'INFO',
    user_id INT NULL,
    user_email VARCHAR(255) NULL,
    user_role VARCHAR(20) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    endpoint VARCHAR(500) NULL,
    method VARCHAR(10) NULL,
    details JSON NULL,
    request_id VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_event_severity_time (event_type, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE', 'RESTORE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    changed_fields TEXT NULL,
    changed_by INT NULL,
    changed_by_email VARCHAR(255) NULL,
    changed_by_ip VARCHAR(45) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at),
    INDEX idx_table_action_time (table_name, action, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(100) NULL,
    is_locked_out BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_email_ip_time (email, ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_lockouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    reason VARCHAR(100) NOT NULL DEFAULT 'Too many failed attempts',
    failed_attempts INT DEFAULT 0,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_at TIMESTAMP NULL,
    unlocked_at TIMESTAMP NULL,
    unlocked_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),
    INDEX idx_unlock_at (unlock_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    token_type ENUM('access', 'refresh') DEFAULT 'access',
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(100) NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked_at (revoked_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STEP 9: Security views
-- =====================================================

CREATE OR REPLACE VIEW v_recent_security_events AS
SELECT event_type, severity, user_email, ip_address, endpoint, created_at
FROM security_audit_log
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW v_failed_login_summary AS
SELECT email, ip_address, COUNT(*) as attempt_count,
  MIN(attempted_at) as first_attempt, MAX(attempted_at) as last_attempt
FROM login_attempts
WHERE success = FALSE AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;

CREATE OR REPLACE VIEW v_suspicious_ips AS
SELECT ip_address, COUNT(DISTINCT event_type) as event_type_count,
  COUNT(*) as total_events, GROUP_CONCAT(DISTINCT event_type) as event_types,
  MAX(created_at) as last_seen
FROM security_audit_log
WHERE severity IN ('HIGH', 'CRITICAL') AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ip_address
ORDER BY total_events DESC
LIMIT 100;

-- =====================================================
-- STEP 10: Stored Procedures
-- =====================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_log_security_event(
    IN p_event_type VARCHAR(50),
    IN p_severity VARCHAR(10),
    IN p_user_id INT,
    IN p_user_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_endpoint VARCHAR(500),
    IN p_method VARCHAR(10),
    IN p_details JSON
)
BEGIN
    INSERT INTO security_audit_log (
        event_type, severity, user_id, user_email,
        ip_address, user_agent, endpoint, method, details
    ) VALUES (
        p_event_type, p_severity, p_user_id, p_user_email,
        p_ip_address, p_user_agent, p_endpoint, p_method, p_details
    );
END //

CREATE PROCEDURE IF NOT EXISTS sp_check_lockout(
    IN p_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    OUT p_is_locked BOOLEAN,
    OUT p_unlock_at TIMESTAMP
)
BEGIN
    SELECT is_active, unlock_at
    INTO p_is_locked, p_unlock_at
    FROM account_lockouts
    WHERE (email = p_email OR ip_address = p_ip_address)
    AND is_active = TRUE
    AND (unlock_at IS NULL OR unlock_at > NOW())
    LIMIT 1;
    IF p_is_locked IS NULL THEN
        SET p_is_locked = FALSE;
    END IF;
END //

CREATE PROCEDURE IF NOT EXISTS sp_record_login_attempt(
    IN p_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_success BOOLEAN,
    IN p_failure_reason VARCHAR(100),
    IN p_lockout_threshold INT,
    IN p_lockout_duration_minutes INT
)
BEGIN
    DECLARE v_recent_failures INT DEFAULT 0;
    INSERT INTO login_attempts (
        email, ip_address, user_agent, success, failure_reason
    ) VALUES (
        p_email, p_ip_address, p_user_agent, p_success, p_failure_reason
    );
    IF NOT p_success THEN
        SELECT COUNT(*) INTO v_recent_failures
        FROM login_attempts
        WHERE email = p_email AND ip_address = p_ip_address
        AND success = FALSE AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE);
        IF v_recent_failures >= p_lockout_threshold THEN
            INSERT INTO account_lockouts (
                email, ip_address, reason, failed_attempts, unlock_at
            ) VALUES (
                p_email, p_ip_address, 'Too many failed login attempts',
                v_recent_failures,
                DATE_ADD(NOW(), INTERVAL p_lockout_duration_minutes MINUTE)
            );
        END IF;
    END IF;
END //

CREATE PROCEDURE IF NOT EXISTS sp_cleanup_audit_logs(
    IN p_retention_days INT
)
BEGIN
    DECLARE v_cutoff_date TIMESTAMP;
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL p_retention_days DAY);
    DELETE FROM security_audit_log WHERE created_at < v_cutoff_date AND severity != 'CRITICAL';
    DELETE FROM data_audit_log WHERE changed_at < v_cutoff_date;
    DELETE FROM login_attempts WHERE attempted_at < v_cutoff_date;
    UPDATE account_lockouts SET is_active = FALSE
    WHERE unlock_at IS NOT NULL AND unlock_at < NOW() AND is_active = TRUE;
END //

DELIMITER ;

-- =====================================================
-- STEP 11: Seed data
-- =====================================================

-- Default admin user (james@gmail.com / james12345)
INSERT INTO users (name, email, password, role) VALUES
('James Admin', 'james@gmail.com', '$2b$10$4pB1UV3N7JeoU8/74Z/us.Ywvs50SDY7bilB2NpWosXJuFOIrGHrm', 'Admin')
ON DUPLICATE KEY UPDATE email=email;

-- Sample case data
INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY, INDEX_CARDS) VALUES
('DKT-2024-001', '2024-01-15', 'PNP Tagbilaran', 'John Doe', 'Theft', '2024-03-20', 'Prosecutor Martinez', 'CRIM-2024-001', 'Branch 1', '2024-02-10', 'Guilty', 'Fine of P5000', 'N/A'),
('DKT-2024-002', '2024-02-20', 'PNP Tagbilaran', 'Jane Smith', 'Assault', '2024-04-15', 'Prosecutor Garcia', 'CRIM-2024-002', 'Branch 2', '2024-03-15', 'Pending', 'Pending', 'N/A'),
('DKT-2024-003', '2024-03-10', 'BIR', 'ABC Company Inc', 'Tax Evasion', NULL, 'Prosecutor Lopez', 'CRIM-2024-003', 'Branch 1', '2024-04-05', 'Pending', 'Pending', 'N/A')
ON DUPLICATE KEY UPDATE DOCKET_NO=DOCKET_NO;

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Database initialization complete!' AS status;
