/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and DoS attempts
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    // Don't rate limit health checks and high-frequency read/polling routes.
    if (req.path === '/health' || req.path === '/api/health') return true;
    if (req.path === '/cases') return true;
    if (req.path === '/api/excel/upload' || req.path === '/api/excel/download') return true;
    if (/^\/api\/user\/\d+\/status$/.test(req.path)) return true;
    return false;
  }
});

/**
 * Strict rate limiter for login/register
 * 5 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true },
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Strict rate limiter for sensitive operations
 * 10 attempts per 1 hour
 */
const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many sensitive operations, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  sensitiveOpLimiter
};
