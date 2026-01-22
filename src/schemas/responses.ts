import { z } from 'zod';

/**
 * API Response Schemas
 * Ensures all API responses follow the same structure
 */

// Generic success response
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    status: z.number().int(),
    message: z.string(),
    data: dataSchema.optional(),
    warnings: z.array(z.string()).optional(),
    timestamp: z.string().datetime(),
  });

// Generic error response
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  status: z.number().int(),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  timestamp: z.string().datetime(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  SuccessResponseSchema(
    z.object({
      items: z.array(dataSchema),
      pagination: PaginationSchema,
    })
  );

// Example: Paginated cases response
export const CaseResponseSchema = z.object({
  id: z.number(),
  docketNo: z.string(),
  complainant: z.string(),
  respondent: z.string(),
});

export const PaginatedCasesResponseSchema = PaginatedResponseSchema(CaseResponseSchema);

export type SuccessResponse<T> = z.infer<
  ReturnType<typeof SuccessResponseSchema<typeof CaseResponseSchema>>
> & {
  data?: T;
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
