/**
 * Standard API Response Handler
 * Ensures all API responses follow a consistent format
 */

class ApiResponse {
  constructor(success, status, message, data = null, errors = null, warnings = null) {
    this.success = success;
    this.status = status;
    this.message = message;
    this.timestamp = new Date().toISOString();
    
    if (data !== null) this.data = data;
    if (errors !== null) this.errors = errors;
    if (warnings !== null) this.warnings = warnings;
  }

  /**
   * Success response
   */
  static success(message, data = null, warnings = null, status = 200) {
    return new ApiResponse(true, status, message, data, null, warnings);
  }

  /**
   * Error response
   */
  static error(message, errors = null, status = 500) {
    return new ApiResponse(false, status, message, null, errors);
  }

  /**
   * Validation error response
   */
  static validationError(errors) {
    return new ApiResponse(false, 400, 'Validation failed', null, errors);
  }

  /**
   * Unauthorized error
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiResponse(false, 401, message);
  }

  /**
   * Forbidden error
   */
  static forbidden(message = 'Forbidden') {
    return new ApiResponse(false, 403, message);
  }

  /**
   * Not found error
   */
  static notFound(message = 'Resource not found') {
    return new ApiResponse(false, 404, message);
  }

  /**
   * Internal server error
   */
  static internalError(message = 'Internal server error') {
    return new ApiResponse(false, 500, message);
  }
}

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default to 500 if no status code
  const status = err.status || err.statusCode || 500;

  // Handle specific error types
  let response;

  if (err.message && err.message.includes('Validation')) {
    response = ApiResponse.validationError([err.message]);
  } else if (status === 401) {
    response = ApiResponse.unauthorized(err.message);
  } else if (status === 403) {
    response = ApiResponse.forbidden(err.message);
  } else if (status === 404) {
    response = ApiResponse.notFound(err.message);
  } else {
    response = ApiResponse.error(
      err.message || 'Internal server error',
      null,
      status
    );
  }

  res.status(status).json(response);
};

/**
 * Async route wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Input validation middleware factory
 */
const validateInput = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        errors.push(`Field "${field}" is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json(ApiResponse.validationError(errors));
    }

    next();
  };
};

module.exports = {
  ApiResponse,
  errorHandler,
  asyncHandler,
  validateInput,
};
