-- Migration: Add DECISION_DATE column to cases and terminated_cases tables
-- Date: 2026-03-02
-- Purpose: Store the date of decision for each case

-- Add DECISION_DATE column to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS DECISION_DATE DATE NULL DEFAULT NULL AFTER PENALTY;

-- Add DECISION_DATE column to terminated_cases table
ALTER TABLE terminated_cases ADD COLUMN IF NOT EXISTS DECISION_DATE DATE NULL DEFAULT NULL AFTER PENALTY;
