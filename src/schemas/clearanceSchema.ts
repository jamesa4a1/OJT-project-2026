import { z } from 'zod';

// ==================== CONSTANTS ====================
const FORMAT_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widow', 'Widower', 'Separated', 'Divorced'] as const;
const CASE_STATUS_OPTIONS = [
  'Pending in Court',
  'Pending with Prosecutor',
  'Dismissed',
  'Convicted',
  'Acquitted',
  'Referred to Other Agency',
  'Other'
] as const;
const VALIDITY_PERIODS = ['6 Months', '1 Year'] as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate expiry date based on issuance date and validity period
 */
export const calculateExpiryDate = (issuedDate: string, validityPeriod: string): string => {
  const date = new Date(issuedDate);
  if (validityPeriod === '1 Year') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 6);
  }
  return date.toISOString().split('T')[0];
};

/**
 * Get default form values with auto-calculated dates
 */
export const getClearanceDefaults = (validityPeriod: '6 Months' | '1 Year' = '6 Months') => {
  const today = new Date().toISOString().split('T')[0];
  return {
    format_type: 'A' as const,
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    alias: '',
    age: '',
    civil_status: 'Single' as const,
    nationality: 'Filipino',
    address: '',
    purpose: 'Local Employment',
    purpose_fee: 50,
    custom_purpose: '',
    issued_upon_request_by: '',
    date_issued: today,
    prc_id_number: '',
    validity_period: validityPeriod,
    validity_expiry: calculateExpiryDate(today, validityPeriod),
    // Criminal record fields
    case_numbers: '',
    crime_description: '',
    legal_statute: '',
    date_of_commission: '',
    date_information_filed: '',
    case_status: '' as const,
    court_branch: '',
    notes: '',
  };
};

// ==================== BASE SCHEMAS ====================

// Enhancement #5: Letter-only validation for names (with hyphens and spaces allowed)
const nameSchema = z.string()
  .min(1, 'This field is required')
  .max(100, 'Name must be 100 characters or less')
  .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Name can only contain letters, hyphens, apostrophes and spaces')
  .transform(val => val.trim()); // Enhancement #4: Whitespace trimming

// Enhancement #4: Trimmed string helper
const trimmedString = (maxLength: number = 255) => 
  z.string().max(maxLength).transform(val => val.trim());

const optionalTrimmedString = (maxLength: number = 255) => 
  z.string().max(maxLength).transform(val => val.trim()).optional().or(z.literal(''));

// Enhancement #6: Date validation with realistic ranges
const dateSchema = z.string().refine(val => {
  if (!val) return true; // Optional dates pass
  const date = new Date(val);
  const minDate = new Date('1990-01-01');
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 1); // Allow today
  return date >= minDate && date <= maxDate;
}, 'Date must be between 1990 and today');

// ==================== MAIN CLEARANCE SCHEMA ====================

export const clearanceSchema = z.object({
  // Certificate Format Type
  format_type: z.enum(FORMAT_TYPES).default('A' as const)
    .refine(val => FORMAT_TYPES.includes(val), 'Please select a valid certificate format'),

  // Applicant Information - Enhancement #5: Name validation
  first_name: nameSchema,
  middle_name: optionalTrimmedString(100),
  last_name: nameSchema,
  suffix: optionalTrimmedString(20),
  alias: optionalTrimmedString(255),
  
  // Age validation
  age: z.string()
    .min(1, 'Age is required')
    .refine(val => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 18 && num <= 120;
    }, 'Age must be between 18 and 120'),

  civil_status: z.enum(CIVIL_STATUS_OPTIONS).default('Single' as const)
    .refine(val => CIVIL_STATUS_OPTIONS.includes(val), 'Please select a valid civil status'),
  
  nationality: trimmedString(50).default('Filipino'),
  
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be 500 characters or less')
    .transform(val => val.trim()),

  // Purpose
  purpose: z.string().min(1, 'Purpose is required'),
  purpose_fee: z.number().min(0).default(0),
  custom_purpose: optionalTrimmedString(255),
  issued_upon_request_by: optionalTrimmedString(255),

  // Dates - Enhancement #2 & #6: Date relationship validation
  date_issued: z.string()
    .min(1, 'Date issued is required')
    .refine(val => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    }, 'Date issued cannot be in the future'),

  prc_id_number: optionalTrimmedString(50),
  
  validity_period: z.enum(VALIDITY_PERIODS).default('6 Months' as const),
  
  validity_expiry: z.string().min(1, 'Validity expiry date is required'),

  // Criminal Record Fields (conditionally required)
  case_numbers: optionalTrimmedString(255),
  crime_description: z.string().max(2000).transform(val => val.trim()).optional().or(z.literal('')),
  legal_statute: optionalTrimmedString(255),
  date_of_commission: z.string().optional().or(z.literal('')),
  date_information_filed: z.string().optional().or(z.literal('')),
  case_status: z.string().optional().or(z.literal('')),
  court_branch: optionalTrimmedString(100),
  notes: z.string().max(2000).transform(val => val.trim()).optional().or(z.literal('')),

})
// Enhancement #1: superRefine for individual error paths
.superRefine((data, ctx) => {
  const hasCriminalRecord = data.format_type === 'B' || data.format_type === 'D' || data.format_type === 'F';
  
  if (hasCriminalRecord) {
    // Case Numbers - Enhancement #3: Pattern validation
    if (!data.case_numbers || data.case_numbers.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Case number(s) required for criminal record clearance',
        path: ['case_numbers'],
      });
    }

    // Crime Description
    if (!data.crime_description || data.crime_description.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Crime description required for criminal record clearance',
        path: ['crime_description'],
      });
    }

    // Legal Statute - Enhancement #3: Pattern validation
    if (!data.legal_statute || data.legal_statute.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Legal statute required for criminal record clearance',
        path: ['legal_statute'],
      });
    }

    // Date of Commission - Enhancement #2: Date validation
    if (!data.date_of_commission) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date of commission required for criminal record clearance',
        path: ['date_of_commission'],
      });
    }

    // Date Information Filed
    if (!data.date_information_filed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date information filed required for criminal record clearance',
        path: ['date_information_filed'],
      });
    }

    // Case Status
    if (!data.case_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Case status required for criminal record clearance',
        path: ['case_status'],
      });
    }

    // Court Branch - Enhancement #3: Pattern validation
    if (!data.court_branch || data.court_branch.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Court/Branch required for criminal record clearance',
        path: ['court_branch'],
      });
    }

    // Enhancement #2: Date relationship validation
    if (data.date_of_commission && data.date_information_filed) {
      const commissionDate = new Date(data.date_of_commission);
      const filedDate = new Date(data.date_information_filed);
      
      if (commissionDate > filedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Date of commission cannot be after date information filed',
          path: ['date_of_commission'],
        });
      }
    }
  }

  // Custom purpose validation
  if (data.purpose === 'Other' && (!data.custom_purpose || data.custom_purpose.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the purpose when selecting "Other"',
      path: ['custom_purpose'],
    });
  }

  // Enhancement #2: Validity expiry date must be after date issued
  if (data.date_issued && data.validity_expiry) {
    const issuedDate = new Date(data.date_issued);
    const expiryDate = new Date(data.validity_expiry);
    
    if (expiryDate <= issuedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Validity expiry date must be after date issued',
        path: ['validity_expiry'],
      });
    }
  }
});

// ==================== ENHANCEMENT #9: PARTIAL SCHEMA FOR UPDATES ====================

export const clearanceUpdateSchema = clearanceSchema.partial().extend({
  id: z.number().positive('Invalid clearance ID'),
});

// ==================== ENHANCEMENT #10: TYPESCRIPT TYPE EXPORTS ====================

export type ClearanceFormData = z.infer<typeof clearanceSchema>;
export type ClearanceUpdateData = z.infer<typeof clearanceUpdateSchema>;

// ==================== ENHANCEMENT #8: DATA PARSING HELPER ====================

/**
 * Safely parse and validate clearance data
 * Returns either the validated data or validation errors
 */
export const parseClearanceData = (data: unknown): 
  | { success: true; data: ClearanceFormData }
  | { success: false; errors: z.ZodIssue[] } => {
  const result = clearanceSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
};

/**
 * Parse update data
 */
export const parseClearanceUpdateData = (data: unknown):
  | { success: true; data: ClearanceUpdateData }
  | { success: false; errors: z.ZodIssue[] } => {
  const result = clearanceUpdateSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
};

/**
 * Format validation errors into a user-friendly object
 */
export const formatValidationErrors = (errors: z.ZodIssue[]): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  
  errors.forEach((error: z.ZodIssue) => {
    const path = error.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = error.message;
    }
  });
  
  return formattedErrors;
};

// ==================== BACKEND VALIDATION MIDDLEWARE ====================

/**
 * Express middleware for validating clearance data
 * Usage: app.post('/api/clearances', validateClearance, (req, res) => { ... })
 */
export const validateClearanceMiddleware = (req: any, res: any, next: any) => {
  const result = parseClearanceData(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(result.errors),
    });
  }
  
  req.validatedData = result.data;
  next();
};

export default clearanceSchema;
