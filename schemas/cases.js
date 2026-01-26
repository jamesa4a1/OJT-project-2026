const { z } = require('zod');

// Case creation validation schema
const CaseCreateSchema = z.object({
  DOCKET_NO: z.string().min(1, 'Docket number is required'),
  DATE_FILED: z.string().min(1, 'Date filed is required'),
  COMPLAINANT: z.string().min(1, 'Complainant name is required'),
  RESPONDENT: z.string().min(1, 'Respondent name is required'),
  ADDRESS_OF_RESPONDENT: z.string().optional().default('N/A'),
  OFFENSE: z.string().min(1, 'Offense is required'),
  DATE_OF_COMMISSION: z.string().min(1, 'Date of commission is required'),
  DATE_RESOLVED: z.string().optional().default('N/A'),
  RESOLVING_PROSECUTOR: z.string().optional().default('N/A'),
  CRIM_CASE_NO: z.string().optional().default('N/A'),
  BRANCH: z.string().optional().default('N/A'),
  DATEFILED_IN_COURT: z.string().optional().default('N/A'),
  REMARKS_DECISION: z.string().optional().default('N/A'),
  PENALTY: z.string().optional().default('N/A'),
});

// Case update validation schema (all fields optional)
const CaseUpdateSchema = z.object({
  id: z.number().or(z.string().transform(Number)),
  updated_fields: z.object({
    DOCKET_NO: z.string().min(1).optional(),
    DATE_FILED: z.string().nullable().optional(),
    COMPLAINANT: z.string().min(1).optional(),
    RESPONDENT: z.string().min(1).optional(),
    ADDRESS_OF_RESPONDENT: z.string().nullable().optional(),
    OFFENSE: z.string().min(1).optional(),
    DATE_OF_COMMISSION: z.string().nullable().optional(),
    DATE_RESOLVED: z.string().nullable().optional(),
    RESOLVING_PROSECUTOR: z.string().nullable().optional(),
    CRIM_CASE_NO: z.string().nullable().optional(),
    BRANCH: z.string().nullable().optional(),
    DATEFILED_IN_COURT: z.string().nullable().optional(),
    REMARKS_DECISION: z.string().nullable().optional(),
    PENALTY: z.string().nullable().optional(),
  }).partial(),
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
  CaseSearchSchema,
};
