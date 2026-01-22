const { ApiResponse } = require('../utils/apiResponse');

/**
 * Middleware for validating request data against Zod schemas
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data from: 'body', 'query', 'params'
 */
const validateRequest = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      
      // Validate data with Zod schema
      const validatedData = await schema.parseAsync(dataToValidate);
      
      // Replace request data with validated/sanitized data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      // Zod validation error
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json(
          ApiResponse.error('Validation failed', 400, { errors })
        );
      }
      
      // Other errors
      return res.status(500).json(
        ApiResponse.error('Internal server error', 500)
      );
    }
  };
};

module.exports = { validateRequest };
