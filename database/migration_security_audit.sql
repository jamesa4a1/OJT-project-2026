-- =====================================================
-- SECURITY AUDIT TABLES MIGRATION
-- =====================================================
-- 
-- This migration creates tables for security auditing and monitoring.
-- Run this migration to enable comprehensive security logging.
--
-- Usage: Execute in MySQL/MariaDB client or through a migration tool
-- =====================================================

USE ocp_docketing;

-- =====================================================
-- 1. Security Audit Log Table
-- =====================================================
-- Stores security-related events (logins, access denials, attack attempts)

CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Event information
    event_type VARCHAR(50) NOT NULL COMMENT 'Type of security event (LOGIN_SUCCESS, ACCESS_DENIED, etc.)',
    severity ENUM('INFO', 'WARN', 'HIGH', 'CRITICAL') DEFAULT 'INFO',
    
    -- User context
    user_id INT NULL COMMENT 'ID of user involved (if authenticated)',
    user_email VARCHAR(255) NULL COMMENT 'Email of user involved',
    user_role VARCHAR(20) NULL COMMENT 'Role of user at time of event',
    
    -- Request context
    ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 address',
    user_agent TEXT NULL COMMENT 'Browser/client user agent string',
    endpoint VARCHAR(500) NULL COMMENT 'API endpoint accessed',
    method VARCHAR(10) NULL COMMENT 'HTTP method (GET, POST, etc.)',
    
    -- Event details
    details JSON NULL COMMENT 'Additional event details as JSON',
    request_id VARCHAR(50) NULL COMMENT 'Unique request identifier for correlation',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for common queries
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_event_severity_time (event_type, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security events audit log for monitoring and investigation';

-- =====================================================
-- 2. Data Change Audit Log Table
-- =====================================================
-- Tracks all INSERT, UPDATE, DELETE operations on important tables

CREATE TABLE IF NOT EXISTS data_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Target information
    table_name VARCHAR(100) NOT NULL COMMENT 'Name of affected table',
    record_id INT NOT NULL COMMENT 'ID of affected record',
    
    -- Change information  
    action ENUM('INSERT', 'UPDATE', 'DELETE', 'RESTORE') NOT NULL,
    
    -- Before/after values (for rollback capability)
    old_values JSON NULL COMMENT 'Previous field values (for UPDATE/DELETE)',
    new_values JSON NULL COMMENT 'New field values (for INSERT/UPDATE)',
    changed_fields TEXT NULL COMMENT 'Comma-separated list of changed field names',
    
    -- User context
    changed_by INT NULL COMMENT 'User ID who made the change',
    changed_by_email VARCHAR(255) NULL,
    changed_by_ip VARCHAR(45) NULL,
    
    -- Timestamps
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at),
    INDEX idx_table_action_time (table_name, action, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Data change audit trail for compliance and rollback';

-- =====================================================
-- 3. Login Attempts Table
-- =====================================================
-- Tracks login attempts for brute force detection

CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Attempt information
    email VARCHAR(255) NOT NULL COMMENT 'Email attempted',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Source IP address',
    user_agent TEXT NULL,
    
    -- Result
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(100) NULL COMMENT 'Reason for failure if unsuccessful',
    
    -- Account lockout tracking
    is_locked_out BOOLEAN DEFAULT FALSE COMMENT 'True if this attempt triggered lockout',
    
    -- Timestamps
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_email_ip_time (email, ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Login attempt tracking for security monitoring';

-- =====================================================
-- 4. Account Lockouts Table
-- =====================================================
-- Tracks account lockouts due to failed login attempts

CREATE TABLE IF NOT EXISTS account_lockouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Lockout target (can be email, IP, or both)
    email VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    
    -- Lockout details
    reason VARCHAR(100) NOT NULL DEFAULT 'Too many failed attempts',
    failed_attempts INT DEFAULT 0,
    
    -- Timestamps
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_at TIMESTAMP NULL COMMENT 'When lockout expires (NULL = permanent)',
    unlocked_at TIMESTAMP NULL COMMENT 'When manually unlocked',
    unlocked_by INT NULL COMMENT 'Admin who unlocked',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),
    INDEX idx_unlock_at (unlock_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Account lockout tracking for brute force protection';

-- =====================================================
-- 5. API Tokens Table (for future JWT blacklisting)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Token identity
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of token (never store actual token)',
    token_type ENUM('access', 'refresh') DEFAULT 'access',
    
    -- Token metadata
    device_info VARCHAR(255) NULL COMMENT 'Device/browser identifier',
    ip_address VARCHAR(45) NULL,
    
    -- Validity
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(100) NULL,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked_at (revoked_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='JWT token tracking for blacklisting and session management';

-- =====================================================
-- 6. Views for Security Monitoring
-- =====================================================

-- Recent security events view
CREATE OR REPLACE VIEW v_recent_security_events AS
SELECT 
    event_type,
    severity,
    user_email,
    ip_address,
    endpoint,
    created_at
FROM security_audit_log
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

-- Failed login summary view
CREATE OR REPLACE VIEW v_failed_login_summary AS
SELECT 
    email,
    ip_address,
    COUNT(*) as attempt_count,
    MIN(attempted_at) as first_attempt,
    MAX(attempted_at) as last_attempt
FROM login_attempts
WHERE success = FALSE
AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;

-- Suspicious IP addresses view
CREATE OR REPLACE VIEW v_suspicious_ips AS
SELECT 
    ip_address,
    COUNT(DISTINCT event_type) as event_type_count,
    COUNT(*) as total_events,
    GROUP_CONCAT(DISTINCT event_type) as event_types,
    MAX(created_at) as last_seen
FROM security_audit_log
WHERE severity IN ('HIGH', 'CRITICAL')
AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ip_address
ORDER BY total_events DESC
LIMIT 100;

-- =====================================================
-- 7. Stored Procedures for Common Operations
-- =====================================================

DELIMITER //

-- Procedure to log a security event
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

-- Procedure to check if IP/email is locked out
CREATE PROCEDURE IF NOT EXISTS sp_check_lockout(
    IN p_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    OUT p_is_locked BOOLEAN,
    OUT p_unlock_at TIMESTAMP
)
BEGIN
    SELECT 
        is_active,
        unlock_at
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

-- Procedure to record login attempt and potentially lock account
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
    
    -- Record the attempt
    INSERT INTO login_attempts (
        email, ip_address, user_agent, success, failure_reason
    ) VALUES (
        p_email, p_ip_address, p_user_agent, p_success, p_failure_reason
    );
    
    -- If failed, check if we should lock out
    IF NOT p_success THEN
        SELECT COUNT(*) INTO v_recent_failures
        FROM login_attempts
        WHERE email = p_email
        AND ip_address = p_ip_address
        AND success = FALSE
        AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE);
        
        IF v_recent_failures >= p_lockout_threshold THEN
            INSERT INTO account_lockouts (
                email, ip_address, reason, failed_attempts, unlock_at
            ) VALUES (
                p_email, p_ip_address, 'Too many failed login attempts', 
                v_recent_failures,
                DATE_ADD(NOW(), INTERVAL p_lockout_duration_minutes MINUTE)
            );
            
            -- Update the login attempt to mark it triggered lockout
            UPDATE login_attempts 
            SET is_locked_out = TRUE 
            WHERE email = p_email 
            AND attempted_at = (SELECT MAX(attempted_at) FROM login_attempts WHERE email = p_email);
        END IF;
    END IF;
END //

-- Procedure to clean up old audit logs
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_audit_logs(
    IN p_retention_days INT
)
BEGIN
    DECLARE v_cutoff_date TIMESTAMP;
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL p_retention_days DAY);
    
    -- Delete old security logs (keep CRITICAL for longer)
    DELETE FROM security_audit_log 
    WHERE created_at < v_cutoff_date 
    AND severity != 'CRITICAL';
    
    -- Delete old data audit logs
    DELETE FROM data_audit_log 
    WHERE changed_at < v_cutoff_date;
    
    -- Delete old login attempts
    DELETE FROM login_attempts 
    WHERE attempted_at < v_cutoff_date;
    
    -- Deactivate expired lockouts
    UPDATE account_lockouts 
    SET is_active = FALSE 
    WHERE unlock_at IS NOT NULL 
    AND unlock_at < NOW() 
    AND is_active = TRUE;
END //

DELIMITER ;

-- =====================================================
-- 8. Initial Data / Indexes Optimization
-- =====================================================

-- Analyze tables for query optimization
ANALYZE TABLE security_audit_log;
ANALYZE TABLE data_audit_log;
ANALYZE TABLE login_attempts;
ANALYZE TABLE account_lockouts;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- 
-- To verify migration:
-- SHOW TABLES LIKE '%audit%';
-- SHOW TABLES LIKE '%login%';
-- SHOW TABLES LIKE '%lockout%';
-- 
-- To test security logging:
-- CALL sp_log_security_event('TEST_EVENT', 'INFO', NULL, 'test@test.com', '127.0.0.1', 'Test', '/test', 'GET', '{}');
-- SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 10;
-- =====================================================
