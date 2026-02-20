const { z } = require('zod');

// Case creation validation schema - matches frontend schema with camelCase keys
const CaseCreateSchema = z.object({
  docketNo: z
    .string()
    .min(1, 'Docket number is required')
    .max(100, 'Docket number must be less than 100 characters'),
  dateFiled: z
    .string()
    .min(1, 'Date filed is required'),
  complainant: z
    .string()
    .min(1, 'Complainant name is required')
    .max(200, 'Complainant name must be less than 200 characters'),
  respondent: z
    .string()
    .min(1, 'Respondent name is required')
    .max(200, 'Respondent name must be less than 200 characters'),
  addressOfRespondent: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters'),
  offense: z
    .string()
    .min(1, 'Offense type is required')
    .max(200, 'Offense must be less than 200 characters'),
  dateOfCommission: z
    .string()
    .min(1, 'Date of commission is required'),
  dateResolved: z.string().optional(),
  resolvingProsecutor: z.string().max(200, 'Name must be less than 200 characters').optional(),
  criminalCaseNo: z.string().max(100, 'Case number must be less than 100 characters').optional(),
  branch: z
    .string()
    .min(1, 'Branch is required')
    .max(100, 'Branch must be less than 100 characters'),
  dateFiledInCourt: z.string().optional(),
  remarksDecision: z.string().max(1000, 'Remarks must be less than 1000 characters').optional(),
  penalty: z.string().max(500, 'Penalty must be less than 500 characters').optional(),
  indexCards: z.string().optional(),
});

// Case update validation schema (all fields optional)
const CaseUpdateSchema = CaseCreateSchema.extend({
  id: z.number().int().positive('ID must be a positive number'),
}).partial().required({ id: true });

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
