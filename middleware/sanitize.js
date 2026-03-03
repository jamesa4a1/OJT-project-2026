/* eslint-disable no-control-regex */
/**
 * Input Sanitization Middleware
 * 
 * Provides protection against XSS, SQL Injection, and other injection attacks.
 * Should be applied early in the middleware chain.
 * 
 * @module middleware/sanitize
 */

const { logSecurityEvent } = require('./rbac');

/**
 * HTML entities for encoding
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char]);
};

/**
 * Decode HTML entities back to characters
 * @param {string} str - String to decode
 * @returns {string} - Decoded string
 */
const decodeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
};

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    // Remove null bytes (can be used to bypass filters)
    .replace(/\0/g, '')
    // Remove control characters (except newlines, tabs, carriage returns)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode to prevent bypasses
    .normalize('NFC')
    // Trim leading/trailing whitespace
    .trim();
};

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Sanitized filename
 */
const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';
  
  return filename
    // Remove path traversal patterns
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    // Remove special characters that may cause issues
    .replace(/[<>:"|?*]/g, '')
    .replace(/[\x00-\x1F]/g, '')
    // Limit length
    .substring(0, 255)
    .trim();
};

/**
 * Recursively sanitize all values in an object
 * @param {*} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {*} - Sanitized object
 */
const sanitizeObject = (obj, options = {}) => {
  const { 
    escapeHtmlContent = false, 
    maxDepth = 10,
    maxStringLength = 10000
  } = options;
  
  // Prevent infinite recursion
  if (maxDepth <= 0) return obj;
  
  // Handle strings
  if (typeof obj === 'string') {
    let sanitized = sanitizeString(obj);
    
    // Truncate excessively long strings
    if (sanitized.length > maxStringLength) {
      sanitized = sanitized.substring(0, maxStringLength);
    }
    
    return escapeHtmlContent ? escapeHtml(sanitized) : sanitized;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, { 
      ...options, 
      maxDepth: maxDepth - 1 
    }));
  }
  
  // Handle objects (but not null)
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value, { 
        ...options, 
        maxDepth: maxDepth - 1 
      });
    }
    
    return sanitized;
  }
  
  // Return primitives as-is
  return obj;
};

/**
 * SQL Injection detection patterns
 * These patterns indicate potential SQL injection attempts
 */
const SQL_INJECTION_PATTERNS = [
  // Basic SQL keywords in suspicious contexts
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC(UTE)?)\s)/i,
  // UNION-based injection
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  // Comment-based injection
  /(--|\/\*|\*\/|#)/,
  // String termination attempts
  /'\s*(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  // Boolean-based injection
  /\b(OR|AND)\s+\d+\s*=\s*\d+\b/i,
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i,
  // Time-based injection
  /\b(SLEEP|WAITFOR|DELAY|BENCHMARK)\s*\(/i,
  // Information gathering
  /\b(VERSION|USER|DATABASE|SCHEMA)\s*\(\s*\)/i,
  // Hex/char encoding attempts
  /0x[0-9a-f]+/i,
  /CHAR\s*\(\s*\d+\s*\)/i
];

/**
 * Check if a string contains SQL injection patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potential SQL injection detected
 */
const containsSqlInjection = (str) => {
  if (typeof str !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * XSS (Cross-Site Scripting) detection patterns
 */
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /\bon\w+\s*=/gi,
  // JavaScript protocol
  /javascript\s*:/gi,
  // Data URI with text/html
  /data\s*:\s*text\/html/gi,
  // VBScript protocol
  /vbscript\s*:/gi,
  // Expression (IE CSS)
  /expression\s*\(/gi,
  // SVG with script
  /<svg[^>]*>[\s\S]*?<script/gi,
  // Iframe injection
  /<iframe[^>]*>/gi,
  // Object/embed tags
  /<(object|embed|applet)[^>]*>/gi,
  // Form action hijacking
  /<form[^>]*action\s*=/gi,
  // Base tag (can redirect all links)
  /<base[^>]*>/gi,
  // Link with javascript
  /<link[^>]*href\s*=\s*["']?javascript/gi,
  // Meta refresh/redirect
  /<meta[^>]*http-equiv\s*=\s*["']?refresh/gi,
  // Style with expression
  /style\s*=\s*["'][^"']*expression\s*\(/gi,
  // Encoded script tag
  /&lt;script/gi
];

/**
 * Check if a string contains XSS patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potential XSS detected
 */
const containsXss = (str) => {
  if (typeof str !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Path traversal detection patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%252e%252e%252f/gi
];

/**
 * Check if a string contains path traversal patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potential path traversal detected
 */
const containsPathTraversal = (str) => {
  if (typeof str !== 'string') return false;
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Command injection detection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\$\(/,
  /`[^`]*`/,
  /\|\|/,
  /&&/,
  /\$\{/,
  />>/,
  /<</
];

/**
 * Check if a string contains command injection patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potential command injection detected
 */
const containsCommandInjection = (str) => {
  if (typeof str !== 'string') return false;
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(str));
};

/**
 * Extract all string values from an object recursively
 * @param {*} obj - Object to extract from
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {string[]} - Array of string values
 */
const extractStrings = (obj, maxDepth = 10) => {
  if (maxDepth <= 0) return [];
  
  if (typeof obj === 'string') return [obj];
  
  if (Array.isArray(obj)) {
    return obj.flatMap(item => extractStrings(item, maxDepth - 1));
  }
  
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap(value => extractStrings(value, maxDepth - 1));
  }
  
  return [];
};

/**
 * Input sanitization middleware factory
 * Creates middleware that sanitizes request body, query, and params
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.checkSqlInjection - Check for SQL injection (default: true)
 * @param {boolean} options.checkXss - Check for XSS (default: true)
 * @param {boolean} options.checkPathTraversal - Check for path traversal (default: true)
 * @param {boolean} options.checkCommandInjection - Check for command injection (default: false)
 * @param {boolean} options.escapeHtml - Escape HTML in all strings (default: false)
 * @param {boolean} options.logAttempts - Log detected attack attempts (default: true)
 * @param {string[]} options.excludePaths - Paths to exclude from sanitization
 * @returns {Function} Express middleware function
 */
const sanitizeInput = (options = {}) => {
  const { 
    checkSqlInjection = true, 
    checkXss = true,
    checkPathTraversal = true,
    checkCommandInjection = false,
    escapeHtml: doEscape = false,
    logAttempts = true,
    excludePaths = []
  } = options;
  
  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Collect all string values for checking
    const allStrings = [
      ...extractStrings(req.body),
      ...extractStrings(req.query),
      ...extractStrings(req.params)
    ];
    
    // Check for SQL injection
    if (checkSqlInjection) {
      for (const value of allStrings) {
        if (containsSqlInjection(value)) {
          if (logAttempts) {
            logSecurityEvent('SQL_INJECTION_ATTEMPT', {
              userId: req.user?.id,
              ip: req.ip,
              endpoint: req.originalUrl,
              method: req.method,
              userAgent: req.headers['user-agent'],
              suspiciousValue: value.substring(0, 200)
            }, 'CRITICAL');
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
            code: 'INVALID_INPUT'
          });
        }
      }
    }
    
    // Check for XSS
    if (checkXss) {
      for (const value of allStrings) {
        if (containsXss(value)) {
          if (logAttempts) {
            logSecurityEvent('XSS_ATTEMPT', {
              userId: req.user?.id,
              ip: req.ip,
              endpoint: req.originalUrl,
              method: req.method,
              userAgent: req.headers['user-agent'],
              suspiciousValue: value.substring(0, 200)
            }, 'CRITICAL');
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
            code: 'INVALID_INPUT'
          });
        }
      }
    }
    
    // Check for path traversal (especially in params)
    if (checkPathTraversal) {
      const pathValues = [
        ...extractStrings(req.params),
        ...extractStrings(req.query)
      ];
      
      for (const value of pathValues) {
        if (containsPathTraversal(value)) {
          if (logAttempts) {
            logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', {
              userId: req.user?.id,
              ip: req.ip,
              endpoint: req.originalUrl,
              method: req.method,
              suspiciousValue: value.substring(0, 200)
            }, 'HIGH');
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid path',
            code: 'INVALID_PATH'
          });
        }
      }
    }
    
    // Check for command injection
    if (checkCommandInjection) {
      for (const value of allStrings) {
        if (containsCommandInjection(value)) {
          if (logAttempts) {
            logSecurityEvent('COMMAND_INJECTION_ATTEMPT', {
              userId: req.user?.id,
              ip: req.ip,
              endpoint: req.originalUrl,
              method: req.method,
              suspiciousValue: value.substring(0, 200)
            }, 'CRITICAL');
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
            code: 'INVALID_INPUT'
          });
        }
      }
    }
    
    // Sanitize all inputs
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, { escapeHtmlContent: doEscape });
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, { escapeHtmlContent: doEscape });
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, { escapeHtmlContent: doEscape });
    }
    
    next();
  };
};

/**
 * Strict sanitization for high-risk inputs
 * Use this for inputs that will be used in file operations, system calls, etc.
 */
const strictSanitize = sanitizeInput({
  checkSqlInjection: true,
  checkXss: true,
  checkPathTraversal: true,
  checkCommandInjection: true,
  escapeHtml: true,
  logAttempts: true
});

/**
 * Light sanitization for general inputs
 * Use this for most form inputs
 */
const lightSanitize = sanitizeInput({
  checkSqlInjection: true,
  checkXss: true,
  checkPathTraversal: false,
  checkCommandInjection: false,
  escapeHtml: false,
  logAttempts: true
});

module.exports = {
  // Utility functions
  escapeHtml,
  decodeHtml,
  sanitizeString,
  sanitizeFilename,
  sanitizeObject,
  
  // Detection functions
  containsSqlInjection,
  containsXss,
  containsPathTraversal,
  containsCommandInjection,
  
  // Middleware
  sanitizeInput,
  strictSanitize,
  lightSanitize
};
