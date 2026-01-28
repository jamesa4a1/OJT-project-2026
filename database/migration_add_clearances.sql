-- Migration: Add Clearances Table for Certificate of Clearance Generator
-- Run this migration to add clearance functionality to the system

-- Create clearances table
CREATE TABLE IF NOT EXISTS clearances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    or_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Official Receipt Number (e.g., OCP-2026-8254607)',
    
    -- Certificate Format Type
    format_type ENUM('A', 'B', 'C', 'D') NOT NULL COMMENT 'A=Individual NoCR, B=Individual HasCR, C=Family NoCR, D=Family HasCR',
    
    -- Applicant Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20) COMMENT 'Jr., Sr., III, etc.',
    alias VARCHAR(255) COMMENT 'For criminal record cases',
    age INT NOT NULL,
    civil_status ENUM('Single', 'Married', 'Widow', 'Widower', 'Separated', 'Divorced') NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Filipino',
    address TEXT NOT NULL,
    
    -- Criminal Record Details (for Format B and D)
    has_criminal_record BOOLEAN DEFAULT FALSE,
    case_numbers VARCHAR(255) COMMENT 'e.g., R-31004 & 31005, Br. 47',
    crime_description TEXT COMMENT 'Full description of offense',
    legal_statute VARCHAR(255) COMMENT 'e.g., Viol. of Secs. 5 & 11, Art. II of R.A 9165',
    date_of_commission DATE,
    date_information_filed DATE,
    case_status ENUM('Pending in Court', 'Pending with Prosecutor', 'Dismissed', 'Convicted', 'Acquitted', 'Referred to Other Agency', 'Other'),
    court_branch VARCHAR(100) COMMENT 'e.g., RTC Br. 47',
    
    -- Clearance Details
    purpose VARCHAR(255) NOT NULL,
    purpose_fee DECIMAL(10, 2) DEFAULT 0.00,
    issued_upon_request_by VARCHAR(255) COMMENT 'For family/requester formats',
    
    -- Issuance Information
    date_issued DATE NOT NULL,
    prc_id_number VARCHAR(50),
    validity_period ENUM('6 Months', '1 Year') DEFAULT '6 Months',
    validity_expiry DATE NOT NULL,
    
    -- System Fields
    issued_by_user_id INT NOT NULL,
    issued_by_name VARCHAR(255) NOT NULL,
    status ENUM('Valid', 'Expired', 'Revoked', 'Cancelled') DEFAULT 'Valid',
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    
    -- Indexes
    INDEX idx_or_number (or_number),
    INDEX idx_applicant_name (last_name, first_name),
    INDEX idx_date_issued (date_issued),
    INDEX idx_status (status),
    INDEX idx_format_type (format_type),
    INDEX idx_has_criminal_record (has_criminal_record),
    INDEX idx_issued_by (issued_by_user_id),
    
    -- Foreign Key
    FOREIGN KEY (issued_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create clearance audit log table for tracking changes
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

-- Create sequence table for OR number generation
CREATE TABLE IF NOT EXISTS clearance_or_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    last_sequence INT DEFAULT 0,
    UNIQUE KEY unique_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize current year sequence
INSERT IGNORE INTO clearance_or_sequence (year, last_sequence) VALUES (YEAR(CURRENT_DATE), 8254600);

-- Purpose fee lookup table (optional but useful)
CREATE TABLE IF NOT EXISTS clearance_purposes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purpose_name VARCHAR(255) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default purposes with fees
INSERT INTO clearance_purposes (purpose_name, fee, sort_order) VALUES
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
