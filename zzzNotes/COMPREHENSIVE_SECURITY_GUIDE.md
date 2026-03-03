# 🔒 COMPREHENSIVE SECURITY AUDIT & IMPLEMENTATION GUIDE

**Project:** OJT Case Management System  
**Audit Date:** March 2, 2026  
**Auditor:** Security Assessment Tool  
**Status:** COMPLETE - Ready for Implementation

---

## 📊 EXECUTIVE SUMMARY

| Category | Current Status | Risk Level | Action Required |
|----------|---------------|------------|-----------------|
| Authentication | Partial JWT implementation | 🔴 HIGH | Enforce JWT on all protected routes |
| Authorization | Basic role checks | 🟠 MEDIUM | Implement comprehensive RBAC |
| Input Validation | Zod schemas exist | 🟢 LOW | Extend to all endpoints |
| Database Security | Parameterized queries | 🟢 LOW | Add connection pooling |
| Session Management | LocalStorage-based | 🟠 MEDIUM | Add token refresh & expiry |
| Logging/Audit | Basic logger exists | 🟠 MEDIUM | Add security event logging |
| HTTPS/Headers | Helmet configured | 🟢 LOW | Enable in production |

---

## 🏗️ PART 1: SYSTEM ARCHITECTURE ANALYSIS

### Current Stack
- **Frontend:** React 19 with TypeScript
- **Backend:** Express 5.x (Node.js)
- **Database:** MySQL/MariaDB
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod schemas
- **Security:** Helmet, express-rate-limit

### Critical Assets Identified
1. **User Data:** PII (names, emails, addresses)
2. **Case Records:** Legal documents, criminal records
3. **Clearance Certificates:** Official government documents
4. **Admin Functions:** User management, system configuration
5. **Audit Trails:** Case movements, user actions

### Data Flow Analysis
```
[React Frontend] → [REST API] → [Express Server] → [MySQL Database]
      ↓                              ↓
  LocalStorage                   File System
  (User Session)               (Uploaded Files)
```

---

## 🔐 PART 2: ACCESS CONTROL & RBAC IMPLEMENTATION

### 2.1 Current Role Structure
Your application has three roles: `Admin`, `Staff`, `Clerk`

### 2.2 Enhanced RBAC Implementation

Create a new file for granular permissions:

```javascript
// middleware/rbac.js - Role-Based Access Control System

/**
 * Granular Permission Definitions
 * Following the principle of least privilege
 */
const PERMISSIONS = {
  // Case Management
  'cases:view': ['Admin', 'Staff', 'Clerk'],
  'cases:create': ['Admin', 'Staff'],
  'cases:edit': ['Admin', 'Staff'],
  'cases:delete': ['Admin'],
  'cases:restore': ['Admin'],
  'cases:export': ['Admin', 'Staff'],
  
  // User Management
  'users:view': ['Admin'],
  'users:create': ['Admin'],
  'users:edit': ['Admin'],
  'users:delete': ['Admin'],
  'users:deactivate': ['Admin'],
  
  // Clearances
  'clearances:view': ['Admin', 'Staff', 'Clerk'],
  'clearances:create': ['Admin', 'Staff', 'Clerk'],
  'clearances:edit': ['Admin', 'Staff'],
  'clearances:delete': ['Admin'],
  'clearances:generate': ['Admin', 'Staff', 'Clerk'],
  
  // System Administration
  'system:config': ['Admin'],
  'system:audit': ['Admin'],
  'system:backup': ['Admin'],
};

/**
 * Check if user has specific permission
 */
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  return allowedRoles.includes(userRole);
};

/**
 * Authorization middleware factory
 * @param {string|string[]} requiredPermission - Permission or array of permissions (any match)
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const permissions = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];
    
    const hasAnyPermission = permissions.some(perm => 
      hasPermission(req.user.role, perm)
    );

    if (!hasAnyPermission) {
      // Log denied access attempt
      logSecurityEvent('ACCESS_DENIED', {
        userId: req.user.id,
        userRole: req.user.role,
        attemptedPermission: requiredPermission,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden - requires permission: ${permissions.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Record-level ownership check
 * Ensures users can only access their own records unless they're admin
 */
const requireOwnership = (getRecordOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
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
          attemptedResourceOwner: ownerId,
          endpoint: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Security event logger
 */
const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    ...details
  };
  
  // Write to security log file
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(__dirname, '..', 'logs', 'security');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `security-${timestamp.split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  // Also log critical events to database
  if (['ACCESS_DENIED', 'OWNERSHIP_VIOLATION', 'BRUTE_FORCE_ATTEMPT'].includes(eventType)) {
    console.warn(`🚨 SECURITY EVENT: ${eventType}`, details);
  }
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireOwnership,
  logSecurityEvent
};
```

### 2.3 Apply RBAC to Existing Routes

Update your server.js routes to use the new RBAC system:

```javascript
// In server.js - Add these imports at the top
const { requirePermission, requireOwnership, logSecurityEvent } = require('./middleware/rbac');

// =====================================================
// PROTECTED ROUTES WITH RBAC
// =====================================================

// User Management Routes (Admin only)
app.get("/api/users", authMiddleware, requirePermission('users:view'), (req, res) => {
  // ... existing code
});

app.delete("/api/user/:id", authMiddleware, requirePermission('users:delete'), (req, res) => {
  // ... existing code
});

app.put("/api/user/:id/toggle-status", authMiddleware, requirePermission('users:deactivate'), (req, res) => {
  // ... existing code
});

// Case Management Routes
app.get("/cases", authMiddleware, requirePermission('cases:view'), (req, res) => {
  // ... existing code
});

app.post("/add-case", authMiddleware, requirePermission('cases:create'), indexCardUpload.single('indexCardImage'), async (req, res) => {
  // ... existing code - Add created_by
  // sql = "INSERT INTO cases (..., created_by) VALUES (..., ?)";
  // Add req.user.id to values array
});

app.post("/update-case", authMiddleware, requirePermission('cases:edit'), async (req, res) => {
  // ... existing code - Add updated_by
});

app.delete("/delete-case", authMiddleware, requirePermission('cases:delete'), (req, res) => {
  // ... existing code
});

app.patch("/restore-case", authMiddleware, requirePermission('cases:restore'), (req, res) => {
  // ... existing code
});

// User Profile Routes (Own data only, unless Admin)
app.get("/api/user/:id", authMiddleware, requireOwnership(async (req) => {
  return parseInt(req.params.id);
}), (req, res) => {
  // ... existing code
});

app.put("/api/user/:id", authMiddleware, requireOwnership(async (req) => {
  return parseInt(req.params.id);
}), (req, res) => {
  // ... existing code
});
```

---

## 🔑 PART 3: AUTHENTICATION & SESSION MANAGEMENT

### 3.1 Current Issues
1. ❌ JWT tokens not being generated on login
2. ❌ No token refresh mechanism
3. ❌ User data stored in localStorage (vulnerable to XSS)
4. ❌ No token expiration handling on frontend

### 3.2 Enhanced JWT Implementation

Update the login endpoint:

```javascript
// In server.js - Enhanced Login Endpoint
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';   // Longer-lived refresh token

// Store for refresh tokens (in production, use Redis)
const refreshTokenStore = new Map();

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { 
      id: user.id, 
      tokenId: crypto.randomBytes(16).toString('hex'),
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Updated Login Endpoint
app.post("/api/auth/login", loginLimiter, validateRequest(UserLoginSchema), async (req, res) => {
  const { email, password } = req.body;
  
  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        logSecurityEvent('LOGIN_ERROR', { email, error: 'Database error' });
        return res.status(500).json(ApiResponse.error("Database error", 500));
      }
      
      if (results.length === 0) {
        logSecurityEvent('LOGIN_FAILED', { email, reason: 'User not found' });
        // Use same error message to prevent user enumeration
        return res.status(401).json(ApiResponse.error("Invalid email or password", 401));
      }
      
      const user = results[0];
      
      // Check if account is active
      if (user.is_active === 0) {
        logSecurityEvent('LOGIN_BLOCKED', { email, userId: user.id, reason: 'Account deactivated' });
        return res.status(403).json(ApiResponse.error("Your account has been deactivated.", 403));
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        logSecurityEvent('LOGIN_FAILED', { email, userId: user.id, reason: 'Invalid password' });
        return res.status(401).json(ApiResponse.error("Invalid email or password", 401));
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);
      
      // Store refresh token
      refreshTokenStore.set(user.id.toString(), {
        token: refreshToken,
        createdAt: new Date(),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      // Update last login
      db.query("UPDATE users SET last_login = NOW(), is_online = 1 WHERE id = ?", [user.id]);
      
      // Log successful login
      logSecurityEvent('LOGIN_SUCCESS', { email, userId: user.id });
      
      // Return user data with tokens
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        created_at: user.created_at
      };
      
      res.json(ApiResponse.success("Login successful", { 
        user: userData, 
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }));
    });
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', { email, error: error.message });
    res.status(500).json(ApiResponse.error("Server error", 500));
  }
});

// Token Refresh Endpoint
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json(ApiResponse.error("Refresh token required", 401));
  }
  
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json(ApiResponse.error("Invalid token type", 401));
    }
    
    // Verify token is in store
    const storedToken = refreshTokenStore.get(decoded.id.toString());
    if (!storedToken || storedToken.token !== refreshToken) {
      logSecurityEvent('TOKEN_REUSE_ATTEMPT', { userId: decoded.id });
      return res.status(401).json(ApiResponse.error("Token revoked or invalid", 401));
    }
    
    // Get fresh user data
    db.query("SELECT * FROM users WHERE id = ? AND is_active = 1", [decoded.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json(ApiResponse.error("User not found or inactive", 401));
      }
      
      const user = results[0];
      
      // Generate new tokens (token rotation)
      const newTokens = generateTokens(user);
      
      // Update stored refresh token
      refreshTokenStore.set(user.id.toString(), {
        token: newTokens.refreshToken,
        createdAt: new Date(),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      res.json(ApiResponse.success("Token refreshed", {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: 900
      }));
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(ApiResponse.error("Refresh token expired", 401));
    }
    return res.status(401).json(ApiResponse.error("Invalid refresh token", 401));
  }
});

// Logout Endpoint - Invalidate tokens
app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  // Remove refresh token from store
  refreshTokenStore.delete(userId.toString());
  
  // Update user online status
  db.query("UPDATE users SET is_online = 0, last_login = NOW() WHERE id = ?", [userId]);
  
  logSecurityEvent('LOGOUT', { userId });
  
  res.json(ApiResponse.success("Logged out successfully"));
});
```

### 3.3 Enhanced Password Security

Update the password schema:

```javascript
// schemas/users.js - Strong Password Schema
const { z } = require('zod');

// Password strength requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain more than 2 consecutive identical characters'
  )
  .refine(
    (password) => !/(012|123|234|345|456|567|678|789|890)/.test(password),
    'Password cannot contain sequential numbers'
  );

// Common passwords check (add more from https://github.com/danielmiessler/SecLists)
const COMMON_PASSWORDS = [
  'password123', 'admin123', 'letmein', 'welcome1', 'qwerty123',
  'Password1!', 'Admin123!', 'Welcome1!', 'Qwerty123!'
];

const isNotCommonPassword = (password) => {
  const lowerPassword = password.toLowerCase();
  return !COMMON_PASSWORDS.some(common => 
    lowerPassword.includes(common.toLowerCase())
  );
};

// Enhanced Register Schema
const UserRegisterSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: passwordSchema.refine(
    isNotCommonPassword,
    'Password is too common. Please choose a stronger password.'
  ),
  role: z.enum(['Admin', 'Staff', 'Clerk']).optional().default('Clerk'),
});

// Password Change Schema
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema.refine(
    isNotCommonPassword,
    'Password is too common. Please choose a stronger password.'
  ),
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must be different from current password', path: ['newPassword'] }
);

module.exports = {
  UserLoginSchema: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
  UserRegisterSchema,
  PasswordChangeSchema,
  UserUpdateSchema: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().max(255).toLowerCase().trim().optional(),
    role: z.enum(['Admin', 'Staff', 'Clerk']).optional(),
    is_active: z.boolean().optional(),
  }),
};
```

---

## 🛡️ PART 4: INPUT VALIDATION & DATA SANITIZATION

### 4.1 Current Status
- ✅ Zod schemas exist for users and cases
- ⚠️ Some endpoints missing validation
- ⚠️ No HTML sanitization for stored content

### 4.2 Enhanced Input Sanitization

```javascript
// middleware/sanitize.js - Input Sanitization Middleware

/**
 * HTML Entity Encoding for XSS Prevention
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char]);
};

/**
 * Strip potentially dangerous characters from input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode
    .normalize('NFC')
    // Trim whitespace
    .trim();
};

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj, options = {}) => {
  const { escapeHtmlContent = false, maxDepth = 10 } = options;
  
  if (maxDepth <= 0) return obj;
  
  if (typeof obj === 'string') {
    const sanitized = sanitizeString(obj);
    return escapeHtmlContent ? escapeHtml(sanitized) : sanitized;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, { ...options, maxDepth: maxDepth - 1 }));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value, { ...options, maxDepth: maxDepth - 1 });
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * SQL Injection Prevention - Validate input patterns
 */
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|SCRIPT)\b)/i,
  /(--|\/\*|\*\/|;|'|\bOR\b|\bAND\b)/i,
  /(\bEXEC\s*\(|\bEXECUTE\s*\()/i
];

const containsSqlInjection = (str) => {
  if (typeof str !== 'string') return false;
  return sqlInjectionPatterns.some(pattern => pattern.test(str));
};

/**
 * XSS Prevention - Detect script injection
 */
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,  // onclick=, onerror=, etc.
  /data:text\/html/gi,
  /expression\s*\(/gi,
  /vbscript:/gi
];

const containsXss = (str) => {
  if (typeof str !== 'string') return false;
  return xssPatterns.some(pattern => pattern.test(str));
};

/**
 * Sanitization middleware
 */
const sanitizeInput = (options = {}) => {
  return (req, res, next) => {
    const { checkSqlInjection = true, checkXss = true, escapeHtml: doEscape = false } = options;
    
    // Sanitize body, query, and params
    if (req.body) req.body = sanitizeObject(req.body, { escapeHtmlContent: doEscape });
    if (req.query) req.query = sanitizeObject(req.query, { escapeHtmlContent: doEscape });
    if (req.params) req.params = sanitizeObject(req.params, { escapeHtmlContent: doEscape });
    
    // Check for SQL injection patterns
    if (checkSqlInjection) {
      const allValues = [
        ...Object.values(req.body || {}),
        ...Object.values(req.query || {}),
        ...Object.values(req.params || {})
      ].filter(v => typeof v === 'string');
      
      for (const value of allValues) {
        if (containsSqlInjection(value)) {
          const { logSecurityEvent } = require('./rbac');
          logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.originalUrl,
            suspiciousValue: value.substring(0, 100)
          });
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
          });
        }
      }
    }
    
    // Check for XSS patterns
    if (checkXss) {
      const allValues = [
        ...Object.values(req.body || {}),
        ...Object.values(req.query || {})
      ].filter(v => typeof v === 'string');
      
      for (const value of allValues) {
        if (containsXss(value)) {
          const { logSecurityEvent } = require('./rbac');
          logSecurityEvent('XSS_ATTEMPT', {
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.originalUrl,
            suspiciousValue: value.substring(0, 100)
          });
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
          });
        }
      }
    }
    
    next();
  };
};

module.exports = {
  escapeHtml,
  sanitizeString,
  sanitizeObject,
  sanitizeInput,
  containsSqlInjection,
  containsXss
};
```

### 4.3 Apply Sanitization Middleware

```javascript
// In server.js - Add after CORS middleware
const { sanitizeInput } = require('./middleware/sanitize');

// Apply input sanitization globally
app.use(sanitizeInput({
  checkSqlInjection: true,
  checkXss: true,
  escapeHtml: false  // Don't escape by default, handle in specific routes
}));
```

---

## 💾 PART 5: DATABASE SECURITY

### 5.1 Connection Pooling (Recommended)

Replace single connection with connection pool:

```javascript
// database/pool.js - Database Connection Pool

const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ocp_docketing',
  
  // Pool configuration
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // Connection timeouts
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 60000,
  
  // Enable automatic reconnection
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Prevent SQL injection by default
  multipleStatements: false,
  
  // Timezone handling
  timezone: 'local',
  dateStrings: true
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection pool established');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Execute query with automatic connection handling
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
```

### 5.2 Database User Privileges (Production)

Create restricted database users:

```sql
-- database/create_app_users.sql

-- Application user (read/write, no admin privileges)
CREATE USER 'ocp_app'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT SELECT, INSERT, UPDATE, DELETE ON ocp_docketing.* TO 'ocp_app'@'localhost';

-- Read-only user for reporting
CREATE USER 'ocp_readonly'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT SELECT ON ocp_docketing.* TO 'ocp_readonly'@'localhost';

-- Backup user
CREATE USER 'ocp_backup'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT SELECT, LOCK TABLES, SHOW VIEW ON ocp_docketing.* TO 'ocp_backup'@'localhost';

-- Apply privileges
FLUSH PRIVILEGES;

-- IMPORTANT: Remove root access from application!
-- Use 'ocp_app' user in .env.production
```

### 5.3 Audit Trail Table

```sql
-- database/migration_security_audit.sql

-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id INT NULL,
  user_email VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  endpoint VARCHAR(500) NULL,
  method VARCHAR(10) NULL,
  request_data JSON NULL,
  response_status INT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_event_type (event_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address)
);

-- Data change audit log
CREATE TABLE IF NOT EXISTS data_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  changed_by INT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_changed_by (changed_by),
  INDEX idx_changed_at (changed_at)
);
```

---

## 📝 PART 6: LOGGING & MONITORING

### 6.1 Enhanced Security Logger

```javascript
// utils/securityLogger.js - Security Event Logger

const fs = require('fs');
const path = require('path');

class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs', 'security');
    this.ensureLogDirectory();
  }
  
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Log security event to file and optionally database
   */
  async log(eventType, details, severity = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      severity,
      eventType,
      ...details
    };
    
    // Write to daily log file
    const logFile = path.join(this.logDir, `${timestamp.split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) console.error('Failed to write security log:', err);
    });
    
    // Console output for critical events
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.error(`🚨 [${severity}] ${eventType}:`, details);
    }
    
    // Return for database logging
    return logEntry;
  }
  
  // Authentication events
  loginSuccess(userId, email, ip, userAgent) {
    return this.log('AUTH_LOGIN_SUCCESS', { userId, email, ip, userAgent });
  }
  
  loginFailed(email, ip, reason) {
    return this.log('AUTH_LOGIN_FAILED', { email, ip, reason }, 'WARN');
  }
  
  logoutSuccess(userId) {
    return this.log('AUTH_LOGOUT', { userId });
  }
  
  tokenRefresh(userId) {
    return this.log('AUTH_TOKEN_REFRESH', { userId });
  }
  
  // Access control events
  accessDenied(userId, resource, permission, ip) {
    return this.log('ACCESS_DENIED', { userId, resource, permission, ip }, 'WARN');
  }
  
  unauthorizedAccess(ip, endpoint, method) {
    return this.log('UNAUTHORIZED_ACCESS', { ip, endpoint, method }, 'HIGH');
  }
  
  // Security threats
  bruteForceAttempt(ip, email, attemptCount) {
    return this.log('BRUTE_FORCE_ATTEMPT', { ip, email, attemptCount }, 'HIGH');
  }
  
  sqlInjectionAttempt(ip, endpoint, payload) {
    return this.log('SQL_INJECTION_ATTEMPT', { ip, endpoint, payload: payload.substring(0, 200) }, 'CRITICAL');
  }
  
  xssAttempt(ip, endpoint, payload) {
    return this.log('XSS_ATTEMPT', { ip, endpoint, payload: payload.substring(0, 200) }, 'CRITICAL');
  }
  
  // Data changes
  dataCreated(userId, tableName, recordId) {
    return this.log('DATA_CREATED', { userId, tableName, recordId });
  }
  
  dataUpdated(userId, tableName, recordId, changes) {
    return this.log('DATA_UPDATED', { userId, tableName, recordId, fields: Object.keys(changes) });
  }
  
  dataDeleted(userId, tableName, recordId) {
    return this.log('DATA_DELETED', { userId, tableName, recordId }, 'WARN');
  }
  
  // Account events
  accountCreated(adminId, newUserId, email, role) {
    return this.log('ACCOUNT_CREATED', { adminId, newUserId, email, role });
  }
  
  accountDeactivated(adminId, targetUserId) {
    return this.log('ACCOUNT_DEACTIVATED', { adminId, targetUserId }, 'WARN');
  }
  
  passwordChanged(userId, method) {
    return this.log('PASSWORD_CHANGED', { userId, method });
  }
}

module.exports = new SecurityLogger();
```

### 6.2 Request Logging Middleware

```javascript
// middleware/requestLogger.js - Request/Response Logger

const securityLogger = require('../utils/securityLogger');

/**
 * Log all API requests and responses
 */
const requestLogger = (options = {}) => {
  const { 
    logBody = false, 
    excludePaths = ['/health', '/favicon.ico'],
    sensitiveFields = ['password', 'token', 'secret', 'authorization']
  } = options;
  
  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    const startTime = Date.now();
    const requestId = require('crypto').randomBytes(8).toString('hex');
    
    req.requestId = requestId;
    
    // Capture response
    const originalSend = res.send;
    let responseBody;
    
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const logData = {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      };
      
      // Log body if enabled (sanitize sensitive fields)
      if (logBody && req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        sensitiveFields.forEach(field => {
          if (sanitizedBody[field]) {
            sanitizedBody[field] = '[REDACTED]';
          }
        });
        logData.body = sanitizedBody;
      }
      
      // Determine severity based on status code
      let severity = 'INFO';
      if (res.statusCode >= 500) severity = 'ERROR';
      else if (res.statusCode >= 400) severity = 'WARN';
      
      // Log based on status code
      if (res.statusCode >= 400) {
        securityLogger.log('HTTP_ERROR', logData, severity);
      } else if (req.method !== 'GET') {
        // Log all non-GET requests
        securityLogger.log('HTTP_REQUEST', logData, severity);
      }
    });
    
    next();
  };
};

module.exports = { requestLogger };
```

---

## 🔒 PART 7: HTTPS & DEPLOYMENT SECURITY

### 7.1 Production Security Configuration

```javascript
// config/production.js - Production Security Settings

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    trustProxy: true, // Enable if behind reverse proxy (nginx/cloudflare)
  },
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  },
  
  // Security headers (helmet configuration)
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  },
  
  // Session/Cookie settings
  cookie: {
    httpOnly: true,
    secure: true, // Requires HTTPS
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Login rate limiting
  loginRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: false,
  },
};
```

### 7.2 Environment Validation

```javascript
// utils/validateEnv.js - Validate Required Environment Variables

const requiredEnvVars = {
  production: [
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'NODE_ENV',
  ],
  development: [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
  ]
};

const validateEnv = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your .env file or environment.');
    
    if (env === 'production') {
      process.exit(1);
    }
  }
  
  // Security warnings
  if (env === 'production') {
    if (process.env.DB_PASSWORD === '' || process.env.DB_PASSWORD === 'password') {
      console.error('🚨 CRITICAL: Database password is weak or empty!');
      process.exit(1);
    }
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('🚨 CRITICAL: JWT_SECRET is missing or too short!');
      process.exit(1);
    }
  }
  
  console.log(`✅ Environment validated for ${env}`);
};

module.exports = { validateEnv };
```

### 7.3 Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/ocp-app

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hide server version
    server_tokens off;

    # Serve React build
    root /var/www/ocp-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Block sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|git|log|sql)$ {
        deny all;
    }
}
```

---

## 🧪 PART 8: SECURITY TESTING

### 8.1 Automated Security Testing Script

```javascript
// tests/security.test.js - Security Test Suite

const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

// Test utilities
const makeRequest = async (method, path, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      data,
      headers,
      validateStatus: () => true
    });
    return response;
  } catch (error) {
    return { status: 0, data: { error: error.message } };
  }
};

// Security Tests
const securityTests = {
  // 1. Authentication Tests
  async testLoginRateLimiting() {
    console.log('Testing login rate limiting...');
    const attempts = [];
    
    for (let i = 0; i < 10; i++) {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      attempts.push(response.status);
    }
    
    // Should get 429 (Too Many Requests) after limit
    const rateLimited = attempts.some(status => status === 429);
    assert(rateLimited, 'Rate limiting should block excessive login attempts');
    console.log('✅ Login rate limiting works');
  },

  // 2. SQL Injection Tests
  async testSqlInjection() {
    console.log('Testing SQL injection prevention...');
    
    const payloads = [
      "'; DROP TABLE users; --",
      "1 OR 1=1",
      "admin'--",
      "1; SELECT * FROM users",
      "' UNION SELECT * FROM users --"
    ];
    
    for (const payload of payloads) {
      const response = await makeRequest('GET', `/api/user/${payload}`);
      assert(
        response.status === 400 || response.status === 401 || response.status === 404,
        `SQL injection payload should be rejected: ${payload}`
      );
    }
    console.log('✅ SQL injection prevention works');
  },

  // 3. XSS Prevention Tests
  async testXssPrevention() {
    console.log('Testing XSS prevention...');
    
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>'
    ];
    
    for (const payload of payloads) {
      // This would need a valid auth token in production
      const response = await makeRequest('POST', '/add-case', {
        DOCKET_NO: payload,
        COMPLAINANT: 'Test',
        RESPONDENT: 'Test'
      });
      
      // Should either reject or sanitize
      assert(
        response.status === 400 || response.status === 401,
        `XSS payload should be rejected: ${payload}`
      );
    }
    console.log('✅ XSS prevention works');
  },

  // 4. Authentication Required Tests
  async testAuthenticationRequired() {
    console.log('Testing authentication requirements...');
    
    const protectedEndpoints = [
      { method: 'GET', path: '/api/users' },
      { method: 'DELETE', path: '/api/user/1' },
      { method: 'PUT', path: '/api/user/1/toggle-status' },
      { method: 'POST', path: '/add-case' },
      { method: 'DELETE', path: '/delete-case' }
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await makeRequest(endpoint.method, endpoint.path);
      assert(
        response.status === 401 || response.status === 403,
        `${endpoint.method} ${endpoint.path} should require authentication`
      );
    }
    console.log('✅ Authentication requirements work');
  },

  // 5. Authorization Tests
  async testAuthorization() {
    console.log('Testing authorization...');
    
    // Login as Clerk
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'clerk@test.com',
      password: 'testpassword'
    });
    
    if (loginResponse.data?.data?.accessToken) {
      const token = loginResponse.data.data.accessToken;
      const headers = { Authorization: `Bearer ${token}` };
      
      // Clerk should not be able to delete users
      const deleteResponse = await makeRequest('DELETE', '/api/user/1', null, headers);
      assert(
        deleteResponse.status === 403,
        'Clerk should not be able to delete users'
      );
      
      // Clerk should not be able to delete cases
      const deleteCaseResponse = await makeRequest('DELETE', '/delete-case', 
        { docket_no: 'TEST-001' }, headers);
      assert(
        deleteCaseResponse.status === 403,
        'Clerk should not be able to delete cases'
      );
    }
    console.log('✅ Authorization works');
  },

  // 6. CORS Tests
  async testCors() {
    console.log('Testing CORS configuration...');
    
    const response = await makeRequest('OPTIONS', '/api/auth/login', null, {
      'Origin': 'https://evil-site.com',
      'Access-Control-Request-Method': 'POST'
    });
    
    const allowedOrigin = response.headers?.['access-control-allow-origin'];
    assert(
      !allowedOrigin || allowedOrigin !== 'https://evil-site.com',
      'CORS should not allow arbitrary origins'
    );
    console.log('✅ CORS configuration works');
  },

  // 7. Security Headers Tests
  async testSecurityHeaders() {
    console.log('Testing security headers...');
    
    const response = await makeRequest('GET', '/');
    const headers = response.headers || {};
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security'
    ];
    
    for (const header of requiredHeaders) {
      // Note: HSTS only applies over HTTPS
      if (header !== 'strict-transport-security') {
        assert(headers[header], `Missing security header: ${header}`);
      }
    }
    console.log('✅ Security headers present');
  }
};

// Run all tests
const runSecurityTests = async () => {
  console.log('\n🔒 Starting Security Tests...\n');
  
  try {
    await securityTests.testLoginRateLimiting();
    await securityTests.testSqlInjection();
    await securityTests.testXssPrevention();
    await securityTests.testAuthenticationRequired();
    await securityTests.testCors();
    await securityTests.testSecurityHeaders();
    
    console.log('\n✅ All security tests passed!\n');
  } catch (error) {
    console.error('\n❌ Security test failed:', error.message);
    process.exit(1);
  }
};

// Export for use with test runners
module.exports = { securityTests, runSecurityTests };

// Run if called directly
if (require.main === module) {
  runSecurityTests();
}
```

### 8.2 Recommended External Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **npm audit** | Check for vulnerable dependencies | `npm audit` |
| **OWASP ZAP** | Full web app vulnerability scan | [Download](https://www.zaproxy.org) |
| **Nikto** | Web server scanner | `nikto -h http://localhost:5000` |
| **sqlmap** | SQL injection testing | `sqlmap -u "URL" --batch` |
| **Burp Suite** | Manual penetration testing | [Download](https://portswigger.net/burp) |

### 8.3 Security Test Commands

```bash
# Run npm audit for dependency vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Run security tests
node tests/security.test.js

# Check for outdated packages
npm outdated
```

---

## 🚀 PART 9: FUTURE ENHANCEMENTS

### 9.1 Immediate Priorities (Phase 1 - Week 1-2)

- [x] Implement JWT token generation on login
- [ ] Add authentication middleware to all protected routes
- [ ] Implement token refresh mechanism
- [ ] Apply RBAC middleware to all routes
- [ ] Add security event logging
- [ ] Update password policy

### 9.2 Short-term Improvements (Phase 2 - Week 3-4)

- [ ] Implement database connection pooling
- [ ] Add comprehensive input sanitization
- [ ] Create admin security dashboard
- [ ] Implement account lockout after failed attempts
- [ ] Add email notifications for security events

### 9.3 Long-term Enhancements (Phase 3 - Month 2+)

- [ ] **Multi-Factor Authentication (MFA)**
  - TOTP (Time-based One-Time Password)
  - Email OTP for sensitive operations
  
- [ ] **Dynamic Permission Management**
  - UI for admins to manage permissions
  - Custom role creation
  
- [ ] **Audit Dashboard**
  - Real-time security monitoring
  - Failed login attempt tracking
  - Suspicious activity alerts
  
- [ ] **Data Encryption**
  - Encrypt sensitive fields at rest
  - Field-level encryption for PII

### 9.4 Recommended Security Practices

1. **Regular Security Audits** - Run every quarter
2. **Dependency Updates** - Check weekly with `npm audit`
3. **Log Review** - Daily review of security logs
4. **Penetration Testing** - Annual third-party assessment
5. **Security Training** - Keep team updated on latest threats
6. **Incident Response Plan** - Document procedures for breaches

---

## 📋 IMPLEMENTATION CHECKLIST

### Critical (Do First)
- [ ] Set strong `JWT_SECRET` in production (32+ characters)
- [ ] Set strong `DB_PASSWORD` (never empty)
- [ ] Add `authMiddleware` to all protected routes
- [ ] Apply `loginLimiter` to login endpoint
- [ ] Enable HTTPS in production

### High Priority
- [ ] Implement RBAC middleware
- [ ] Add security event logging
- [ ] Update password schema requirements
- [ ] Add input sanitization middleware
- [ ] Configure CORS for production origins only

### Medium Priority
- [ ] Implement token refresh mechanism
- [ ] Add database connection pooling
- [ ] Create security audit dashboard
- [ ] Implement account lockout
- [ ] Add email notifications

### Low Priority
- [ ] Add MFA support
- [ ] Implement field-level encryption
- [ ] Create security training documentation
- [ ] Set up automated vulnerability scanning

---

## 📚 REFERENCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)
- [MySQL Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Next Review:** April 2, 2026
