-- HOJ Database Seed File
-- This file initializes the database with tables and sample data

-- Create database
CREATE DATABASE IF NOT EXISTS ocp_docketing;
USE ocp_docketing;

-- Create users table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DOCKET_NO VARCHAR(255) UNIQUE NOT NULL,
  DATE_FILED DATE NOT NULL,
  COMPLAINANT VARCHAR(255) NOT NULL,
  RESPONDENT VARCHAR(255) NOT NULL,
  ADDRESS_OF_RESPONDENT VARCHAR(500) DEFAULT '',
  OFFENSE VARCHAR(255) NOT NULL,
  DATE_OF_COMMISSION DATE,
  DATE_RESOLVED DATE,
  RESOLVING_PROSECUTOR VARCHAR(255),
  CRIM_CASE_NO VARCHAR(255),
  BRANCH VARCHAR(255),
  DATEFILED_IN_COURT DATE,
  REMARKS_DECISION TEXT,
  PENALTY VARCHAR(255),
  INDEX_CARDS VARCHAR(500),
  is_deleted TINYINT DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
-- Email: james@gmail.com
-- Password: james12345 (hashed with bcryptjs)
INSERT INTO users (name, email, password, role) VALUES 
('James Admin', 'james@gmail.com', '$2b$10$4pB1UV3N7JeoU8/74Z/us.Ywvs50SDY7bilB2NpWosXJuFOIrGHrm', 'Admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample case data
INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, DATE_RESOLVED, RESOLVING_PROSECUTOR, CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY, INDEX_CARDS) VALUES
('DKT-2024-001', '2024-01-15', 'PNP Tagbilaran', 'John Doe', 'Theft', '2024-03-20', 'Prosecutor Martinez', 'CRIM-2024-001', 'Branch 1', '2024-02-10', 'Guilty', 'Fine of P5000', 'N/A'),
('DKT-2024-002', '2024-02-20', 'PNP Tagbilaran', 'Jane Smith', 'Assault', '2024-04-15', 'Prosecutor Garcia', 'CRIM-2024-002', 'Branch 2', '2024-03-15', 'Pending', 'Pending', 'N/A'),
('DKT-2024-003', '2024-03-10', 'BIR', 'ABC Company Inc', 'Tax Evasion', NULL, 'Prosecutor Lopez', 'CRIM-2024-003', 'Branch 1', '2024-04-05', 'Pending', 'Pending', 'N/A');
