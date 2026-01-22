import { AxiosError } from 'axios';
import { ApiErrorResponse } from './api';

/**
 * Custom error handler for API responses
 */
export class ApiErrorHandler extends Error {
  public status: number;
  public errors?: string[];

  constructor(error: unknown) {
    let message = 'An unexpected error occurred';
    let status = 500;
    let errors: string[] | undefined;

    if (error instanceof AxiosError) {
      status = error.response?.status || 500;
      message = error.response?.data?.message || error.message;
      errors = error.response?.data?.errors;
    } else if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      message = error.message;
    }

    super(message);
    this.name = 'ApiErrorHandler';
    this.status = status;
    this.errors = errors;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'You are not authenticated. Please log in.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      500: 'An error occurred on the server. Please try again later.',
      503: 'The service is temporarily unavailable.',
    };

    return messages[this.status] || this.message;
  }

  /**
   * Check if error is retriable
   */
  isRetriable(): boolean {
    return [408, 429, 500, 502, 503, 504].includes(this.status);
  }

  /**
   * Log error details for debugging
   */
  logDetails(): void {
    console.error('[API Error]', {
      status: this.status,
      message: this.message,
      errors: this.errors,
    });
  }
}

/**
 * Retry mechanism for failed requests
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof ApiErrorHandler && !error.isRetriable()) {
        throw error;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};
