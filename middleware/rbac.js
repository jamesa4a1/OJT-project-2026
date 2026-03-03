/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * This middleware provides granular permission control for API endpoints.
 * It implements the principle of least privilege and logs security events.
 * 
 * @module middleware/rbac
 */

const fs = require('fs');
const path = require('path');

/**
 * Permission definitions mapping permissions to allowed roles
 * Following OWASP guidelines for access control
 */
const PERMISSIONS = {
  // Case Management Permissions
  'cases:view': ['Admin', 'Staff', 'Clerk'],
  'cases:create': ['Admin', 'Staff'],
  'cases:edit': ['Admin', 'Staff'],
  'cases:delete': ['Admin'],
  'cases:restore': ['Admin'],
  'cases:export': ['Admin', 'Staff'],
  'cases:import': ['Admin'],
  'cases:permanent_delete': ['Admin'],
  
  // User Management Permissions
  'users:view': ['Admin'],
  'users:view_own': ['Admin', 'Staff', 'Clerk'],
  'users:create': ['Admin'],
  'users:edit': ['Admin'],
  'users:edit_own': ['Admin', 'Staff', 'Clerk'],
  'users:delete': ['Admin'],
  'users:deactivate': ['Admin'],
  'users:change_role': ['Admin'],
  
  // Clearance Permissions
  'clearances:view': ['Admin', 'Staff', 'Clerk'],
  'clearances:create': ['Admin', 'Staff', 'Clerk'],
  'clearances:edit': ['Admin', 'Staff'],
  'clearances:delete': ['Admin'],
  'clearances:generate': ['Admin', 'Staff', 'Clerk'],
  'clearances:archive': ['Admin', 'Staff'],
  
  // System Administration Permissions
  'system:config': ['Admin'],
  'system:audit': ['Admin'],
  'system:backup': ['Admin'],
  'system:logs': ['Admin'],
  'system:auto_delete': ['Admin'],
  
  // Report Permissions
  'reports:view': ['Admin', 'Staff'],
  'reports:generate': ['Admin', 'Staff'],
  'reports:export': ['Admin', 'Staff'],
};

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the role has the permission
 */
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  
  if (!allowedRoles) {
    console.warn(`[RBAC] Unknown permission requested: ${permission}`);
    return false;
  }
  
  return allowedRoles.includes(userRole);
};

/**
 * Get all permissions for a specific role
 * @param {string} role - The role to get permissions for
 * @returns {string[]} - Array of permission names
 */
const getRolePermissions = (role) => {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
};

/**
 * Security event logger
 * Logs security-related events to both file and console
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 * @param {string} severity - Event severity (INFO, WARN, HIGH, CRITICAL)
 */
const logSecurityEvent = (eventType, details, severity = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    severity,
    eventType,
    ...details
  };
  
  // Create log directory if it doesn't exist
  const logDir = path.join(__dirname, '..', 'logs', 'security');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Write to daily log file
  const logFile = path.join(logDir, `security-${timestamp.split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('[RBAC] Failed to write security log:', err.message);
  });
  
  // Console output for important events
  const severityColors = {
    INFO: '\x1b[36m',     // Cyan
    WARN: '\x1b[33m',     // Yellow
    HIGH: '\x1b[31m',     // Red
    CRITICAL: '\x1b[41m'  // Red background
  };
  const reset = '\x1b[0m';
  const color = severityColors[severity] || '';
  
  if (severity === 'WARN' || severity === 'HIGH' || severity === 'CRITICAL') {
    console.log(`${color}[SECURITY ${severity}]${reset} ${eventType}:`, 
      JSON.stringify(details, null, 0));
  }
  
  return logEntry;
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required permission(s)
 * 
 * @param {string|string[]} requiredPermission - Permission(s) required (any match passes)
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.get('/api/users', authMiddleware, requirePermission('users:view'), handler);
 * app.post('/cases', authMiddleware, requirePermission(['cases:create', 'cases:import']), handler);
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.headers['user-agent']
      }, 'WARN');
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Convert to array for consistent handling
    const permissions = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];
    
    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some(perm => 
      hasPermission(req.user.role, perm)
    );

    if (!hasAnyPermission) {
      logSecurityEvent('ACCESS_DENIED', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        attemptedPermission: requiredPermission,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      }, 'WARN');

      return res.status(403).json({
        success: false,
        message: `Forbidden - requires permission: ${permissions.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Permission granted
    next();
  };
};

/**
 * Role authorization middleware factory
 * Creates middleware that checks if user has one of the allowed roles
 * 
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.delete('/api/user/:id', authMiddleware, requireRole(['Admin']), handler);
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent('ROLE_CHECK_FAILED', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      }, 'WARN');

      return res.status(403).json({
        success: false,
        message: `Forbidden - requires role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Record-level ownership check middleware factory
 * Ensures users can only access their own records (unless Admin)
 * 
 * @param {Function} getRecordOwnerId - Async function that returns the owner's user ID
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.get('/api/user/:id', authMiddleware, requireOwnership(async (req) => {
 *   return parseInt(req.params.id);
 * }), handler);
 */
const requireOwnership = (getRecordOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admins bypass ownership check
    if (req.user.role === 'Admin') {
      return next();
    }

    try {
      const ownerId = await getRecordOwnerId(req);
      
      if (ownerId !== req.user.id) {
        logSecurityEvent('OWNERSHIP_VIOLATION', {
          userId: req.user.id,
          userRole: req.user.role,
          attemptedResourceOwner: ownerId,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip
        }, 'HIGH');

        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('[RBAC] Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

/**
 * Combined permission and ownership check
 * User must have permission AND own the resource (or be Admin)
 * 
 * @param {string|string[]} requiredPermission - Required permission(s)
 * @param {Function} getRecordOwnerId - Function to get resource owner ID
 * @returns {Function[]} Array of middleware functions
 */
const requirePermissionAndOwnership = (requiredPermission, getRecordOwnerId) => {
  return [
    requirePermission(requiredPermission),
    requireOwnership(getRecordOwnerId)
  ];
};

/**
 * Admin-only shortcut middleware
 */
const adminOnly = requireRole(['Admin']);

/**
 * Staff and Admin shortcut middleware
 */
const staffOrAdmin = requireRole(['Admin', 'Staff']);

module.exports = {
  // Permission constants
  PERMISSIONS,
  
  // Permission checking functions
  hasPermission,
  getRolePermissions,
  
  // Middleware factories
  requirePermission,
  requireRole,
  requireOwnership,
  requirePermissionAndOwnership,
  
  // Shortcut middleware
  adminOnly,
  staffOrAdmin,
  
  // Logging
  logSecurityEvent
};
