/**
 * Security Headers Middleware
 * Sets important HTTP security headers
 */

const helmet = require('helmet');

/**
 * Configure security headers using helmet
 * Protects against various common web vulnerabilities
 */
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // Prevents clickjacking
    },
    xContentTypeOptions: true, // Prevents MIME-type sniffing
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
};

/**
 * Additional custom security headers
 */
const customSecurityHeaders = (req, res, next) => {
  // Prevent browsers from caching sensitive responses
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Prevent information leakage
  res.removeHeader('X-Powered-By');
  if (res.getHeader('Server')) {
    res.removeHeader('Server');
  }
  
  // Additional security headers
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');
  
  next();
};

module.exports = {
  securityHeaders,
  customSecurityHeaders
};
