import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

/**
 * Custom hook for Zod validation
 * Handles form validation with error management
 */

export interface UseValidationOptions {
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export const useValidation = <T extends Record<string, any>>(
  schema: ZodSchema,
  options: UseValidationOptions = { mode: 'onSubmit' }
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate data and return result
   */
  const validate = useCallback(
    async (data: unknown) => {
      setIsValidating(true);
      try {
        const validatedData = await schema.parseAsync(data);
        setErrors({});
        return { success: true, data: validatedData };
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};

          (error as any).errors.forEach((err: any) => {
            const path = err.path.join('.');
            fieldErrors[path] = err.message;
          });

          setErrors(fieldErrors);
          return { success: false, errors: fieldErrors };
        }

        return { success: false, errors: { general: 'Validation failed' } };
      } finally {
        setIsValidating(false);
      }
    },
    [schema]
  );

  /**
   * Validate single field
   */
  const validateField = useCallback(
    async (fieldName: string, value: any) => {
      try {
        // Try to validate just this field
        const testData = { [fieldName]: value };
        await schema.parseAsync(testData);

        // Clear error for this field
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });

        return { success: true };
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldError = (error as any).errors.find((err: any) => err.path[0] === fieldName);

          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [fieldName]: fieldError.message,
            }));
          }

          return { success: false, error: fieldError?.message };
        }

        return { success: false };
      }
    },
    [schema]
  );

  /**
   * Clear specific field error or all errors
   */
  const clearError = useCallback((fieldName?: string) => {
    setErrors((prev) => {
      if (fieldName) {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      }
      return {};
    });
  }, []);

  /**
   * Reset all errors
   */
  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    validate,
    validateField,
    clearError,
    resetErrors,
    errors,
    isValidating,
    hasErrors: Object.keys(errors).length > 0,
  };
};

export default useValidation;
