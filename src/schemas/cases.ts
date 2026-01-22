import { z } from 'zod';

/**
 * Case Schema using Zod
 * Defines validation rules and automatically infers TypeScript types
 * This schema is shared between frontend and backend
 */

// Base case schema for creating new cases
export const CaseCreateSchema = z.object({
  docketNo: z
    .string()
    .min(1, 'Docket number is required')
    .max(100, 'Docket number must be less than 100 characters'),
  dateFiled: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .or(z.date())
    .pipe(z.coerce.date()),
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
    .datetime({ message: 'Invalid date format' })
    .or(z.date())
    .pipe(z.coerce.date()),
  dateResolved: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .or(z.date())
    .pipe(z.coerce.date())
    .optional(),
  resolvingProsecutor: z.string().max(200, 'Name must be less than 200 characters').optional(),
  criminalCaseNo: z.string().max(100, 'Case number must be less than 100 characters').optional(),
  branch: z
    .string()
    .min(1, 'Branch is required')
    .max(100, 'Branch must be less than 100 characters'),
  dateFiledInCourt: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .or(z.date())
    .pipe(z.coerce.date())
    .optional(),
  remarksDecision: z.string().max(1000, 'Remarks must be less than 1000 characters').optional(),
  penalty: z.string().max(500, 'Penalty must be less than 500 characters').optional(),
  indexCards: z.string().max(500, 'Index cards must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
});

// Full case schema (includes ID for updates)
export const CaseUpdateSchema = CaseCreateSchema.extend({
  id: z.number().int().positive('ID must be a positive number'),
});

// Case schema with ID (for responses)
export const CaseSchema = CaseCreateSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Array of cases
export const CasesArraySchema = z.array(CaseSchema);

// Partial case for filtering/searching
export const CaseFilterSchema = CaseCreateSchema.partial();

/**
 * Type Inference from Schemas
 * These types are automatically generated from the schemas above
 * Now frontend and backend always agree on types!
 */
export type CaseCreate = z.infer<typeof CaseCreateSchema>;
export type CaseUpdate = z.infer<typeof CaseUpdateSchema>;
export type Case = z.infer<typeof CaseSchema>;
export type Cases = z.infer<typeof CasesArraySchema>;
export type CaseFilter = z.infer<typeof CaseFilterSchema>;

/**
 * Validation helper functions
 */

/**
 * Validate case data for creation
 */
export const validateCaseCreate = (data: unknown) => {
  return CaseCreateSchema.safeParse(data);
};

/**
 * Validate case data for update
 */
export const validateCaseUpdate = (data: unknown) => {
  return CaseUpdateSchema.safeParse(data);
};

/**
 * Validate array of cases
 */
export const validateCasesArray = (data: unknown) => {
  return CasesArraySchema.safeParse(data);
};

/**
 * Throw error if validation fails (for server-side use)
 */
export const validateCaseCreateOrThrow = (data: unknown): CaseCreate => {
  return CaseCreateSchema.parse(data);
};

export const validateCaseUpdateOrThrow = (data: unknown): CaseUpdate => {
  return CaseUpdateSchema.parse(data);
};
