/**
 * Authentication & Authorization Middleware
 * Provides JWT-based authentication and role-based access control
 */

const jwt = require('jsonwebtoken');
const { ApiResponse } = require('../utils/apiResponse');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345678901234567890123456789012';

/**
 * Authenticate request using JWT token
 * Token should be in Authorization header: "Bearer <token>"
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        ApiResponse.error('Unauthorized - No token provided', 401)
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json(
        ApiResponse.error('Unauthorized - Invalid or expired token', 401)
      );
    }
  } catch (err) {
    return res.status(500).json(
      ApiResponse.error('Internal server error', 500)
    );
  }
};

/**
 * Authorize request based on user role
 * @param {string[]} allowedRoles - Array of roles that are allowed (e.g., ['Admin', 'Staff'])
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        ApiResponse.error('Unauthorized', 401)
      );
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        ApiResponse.error(
          `Forbidden - This action requires one of these roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token, but populates req.user if token provided
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Token invalid, but it's optional so we continue
      }
    }
    
    next();
  } catch (err) {
    next();
  }
};

module.exports = {
  authMiddleware,
  authorize,
  optionalAuth
};
