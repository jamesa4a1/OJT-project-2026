const { z } = require('zod');

// Case creation validation schema - only requires primary fields
const CaseCreateSchema = z.object({
  DOCKET_NO: z.string().min(1, 'Docket number is required').max(100, 'Docket number must be less than 100 characters'),
  DATE_FILED: z.string().min(1, 'Date filed is required'),
  COMPLAINANT: z.string().min(1, 'Complainant name is required').max(200, 'Complainant name must be less than 200 characters'),
  RESPONDENT: z.string().min(1, 'Respondent name is required'),
  OFFENSE: z.string().min(1, 'Offense is required').max(200, 'Offense must be less than 200 characters'),
  ADDRESS_OF_RESPONDENT: z.string().min(1, 'Address of respondent is required').max(500, 'Address must be less than 500 characters'),
  RESOLVING_PROSECUTOR: z.string().min(1, 'Resolving prosecutor is required').max(200, 'Name must be less than 200 characters'),
  // Optional fields
  DATE_OF_COMMISSION: z.string().nullable().optional(),
  DATE_RESOLVED: z.string().nullable().optional(),
  CRIM_CASE_NO: z.string().nullable().optional(),
  BRANCH: z.string().nullable().optional(),
  DATEFILED_IN_COURT: z.string().nullable().optional(),
  FINAL_OFFENSE: z.string().nullable().optional(),
  REMARKS_DECISION: z.string().nullable().optional(),
  PENALTY: z.string().nullable().optional(),
  DECISION_DATE: z.string().nullable().optional(),
  STATUS: z.string().nullable().optional(),
  INDEX_CARDS: z.string().nullable().optional(),
});

// Case update validation schema - all fields nullable and optional
const CaseUpdateSchema = z.object({
  DOCKET_NO: z.string().max(100, 'Docket number must be less than 100 characters').nullable().optional(),
  DATE_FILED: z.string().nullable().optional(),
  COMPLAINANT: z.string().max(200, 'Complainant name must be less than 200 characters').nullable().optional(),
  RESPONDENT: z.string().nullable().optional(),
  ADDRESS_OF_RESPONDENT: z.string().max(500, 'Address must be less than 500 characters').nullable().optional(),
  OFFENSE: z.string().max(200, 'Offense must be less than 200 characters').nullable().optional(),
  DATE_OF_COMMISSION: z.string().nullable().optional(),
  DATE_RESOLVED: z.string().nullable().optional(),
  RESOLVING_PROSECUTOR: z.string().max(200, 'Name must be less than 200 characters').nullable().optional(),
  CRIM_CASE_NO: z.string().max(100, 'Case number must be less than 100 characters').nullable().optional(),
  BRANCH: z.string().max(100, 'Branch must be less than 100 characters').nullable().optional(),
  DATEFILED_IN_COURT: z.string().nullable().optional(),
  FINAL_OFFENSE: z.string().max(255, 'Final offense must be less than 255 characters').nullable().optional(),
  REMARKS_DECISION: z.string().max(1000, 'Remarks must be less than 1000 characters').nullable().optional(),
  PENALTY: z.string().max(500, 'Penalty must be less than 500 characters').nullable().optional(),
  DECISION_DATE: z.string().nullable().optional(),
  STATUS: z.string().nullable().optional(),
  INDEX_CARDS: z.string().nullable().optional(),
  MR_FILED_BY: z.string().max(1000, 'MR Filed By must be less than 1000 characters').nullable().optional(),
  DATE_MR_FILING: z.string().max(500).nullable().optional(),
  DATE_MR_RESOLVED: z.string().max(500).nullable().optional(),
  MR_FINDING: z.string().max(1000, 'Finding must be less than 1000 characters').nullable().optional(),
});

// Case edit validation schema (all fields optional, flexible)
const CaseEditSchema = z.object({
  id: z.number().int().positive('ID must be a positive number'),
  updated_fields: z.record(z.any()).optional(), // Accept any fields for maximum flexibility
});

// Case search validation schema
const CaseSearchSchema = z.object({
  docket_no: z.string().optional(),
  respondent: z.string().optional(),
  resolving_prosecutor: z.string().optional(),
  remarks: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.values(data).some(value => value !== undefined && value !== '');
  },
  {
    message: 'At least one search criteria is required',
  }
);

module.exports = {
  CaseCreateSchema,
  CaseUpdateSchema,
  CaseEditSchema,
  CaseSearchSchema,
};
