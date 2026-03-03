# 🔒 Security Features Quick Reference

## For Developers

### 1. Protecting New API Endpoints

```javascript
// Admin only
app.get('/api/admin-route', authMiddleware, adminOnly, (req, res) => {
  // Your code here
});

// Staff or Admin
app.post('/api/staff-route', authMiddleware, staffOrAdmin, (req, res) => {
  // Your code here
});

// Specific permission
app.put('/api/reports', authMiddleware, requirePermission('reports:create'), (req, res) => {
  // Your code here
});

// Multiple permissions (user needs ALL)
app.delete('/api/critical', 
  authMiddleware, 
  requirePermission(['users:delete', 'system:admin']), 
  (req, res) => {
    // Your code here
  }
);
```

### 2. Logging Security Events

```javascript
const securityLogger = require('./utils/securityLogger');

// Login events
securityLogger.loginSuccess(userId, email, req.ip);
securityLogger.loginFailed(userId, email, req.ip);

// Access control
securityLogger.accessDenied(userId, 'resource-name', req.ip);

// Data changes
securityLogger.dataCreated(userId, 'cases', recordId, req.ip);
securityLogger.dataModified(userId, 'cases', recordId, changes, req.ip);
securityLogger.dataDeleted(userId, 'cases', recordId, req.ip);

// Security threats
securityLogger.sqlInjectionAttempt(maliciousInput, req.ip);
securityLogger.xssAttempt(maliciousInput, req.ip);
securityLogger.bruteForceAttempt(email, req.ip);
```

### 3. Input Sanitization

Automatically applied globally, but you can also use manually:

```javascript
const { sanitizeInput, detectSQLInjection, detectXSS } = require('./middleware/sanitize');

// Manual sanitization
const cleanInput = sanitizeString(userInput);
const cleanFilename = sanitizeFilename(uploadedFilename);

// Detection
if (detectSQLInjection(userInput)) {
  // Handle malicious input
}

if (detectXSS(userInput)) {
  // Handle XSS attempt
}
```

### 4. Checking Permissions in Code

```javascript
const { hasPermission } = require('./middleware/rbac');

// Check if user has permission
if (hasPermission(userRole, 'cases:delete')) {
  // Allow deletion
} else {
  // Deny access
}
```

### 5. Available Permissions

```javascript
// User Management
'users:view', 'users:create', 'users:update', 'users:delete', 
'users:activate', 'users:assign_roles', 'users:list'

// Case Management
'cases:view', 'cases:create', 'cases:update', 'cases:delete',
'cases:search', 'cases:export', 'cases:archive', 'cases:restore'

// Clearances
'clearances:view', 'clearances:generate', 'clearances:update'

// Reports
'reports:view', 'reports:generate', 'reports:export'

// System
'system:settings', 'system:backup', 'system:admin', 'system:logs'

// Profile
'profile:view', 'profile:update', 'profile:change_password'
```

---

## For System Administrators

### Running the Server

```bash
# Development
node server.js

# Production (with environment)
NODE_ENV=production node server.js
```

### Database Migration

```bash
# Run security audit tables migration
Get-Content database/migration_security_audit.sql | C:\xampp\mysql\bin\mysql.exe -u root -p ocp_docketing

# Verify tables created
mysql -u root -p -e "USE ocp_docketing; SHOW TABLES LIKE '%audit%';"
```

### Monitoring Security Logs

```bash
# View today's security log
Get-Content logs/security-2026-03-02.log -Tail 50

# Follow security log in real-time
Get-Content logs/security-2026-03-02.log -Wait

# Search for failed logins
Get-Content logs/security-*.log | Select-String "LOGIN_FAILED"

# Search for SQL injection attempts
Get-Content logs/security-*.log | Select-String "SQL_INJECTION"
```

### Querying Audit Tables

```sql
-- Recent security events
SELECT * FROM security_audit_log 
ORDER BY created_at DESC 
LIMIT 50;

-- Failed login attempts today
SELECT * FROM login_attempts 
WHERE attempt_time >= CURDATE() 
  AND success = 0;

-- Locked out accounts
SELECT * FROM account_lockouts 
WHERE is_active = 1;

-- Recent data changes
SELECT * FROM data_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Managing User Roles

```sql
-- View all users and their roles
SELECT id, name, email, role, is_active 
FROM users 
ORDER BY role, name;

-- Change user role
UPDATE users 
SET role = 'Staff' 
WHERE id = 123;

-- Deactivate user
UPDATE users 
SET is_active = 0 
WHERE id = 123;
```

### Security Checklist

#### Daily
- [ ] Check security logs for anomalies
- [ ] Review failed login attempts
- [ ] Monitor system performance

#### Weekly  
- [ ] Review audit logs
- [ ] Check for locked accounts
- [ ] Update dependencies: `npm outdated`

#### Monthly
- [ ] Run security tests: `node tests/security.test.js`
- [ ] Review user permissions
- [ ] Audit active sessions
- [ ] Backup audit logs

#### Quarterly
- [ ] Full security audit
- [ ] Review and update security policies
- [ ] Penetration testing
- [ ] Update documentation

---

## Troubleshooting

### Issue: "Unauthorized - No token provided"

**Solution:**
- Ensure the frontend is sending the JWT token in the Authorization header:
  ```javascript
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
  ```

### Issue: "Permission denied"

**Solution:**
- Check user's role in database
- Verify required permissions in RBAC middleware
- Check security logs for details

### Issue: Input being rejected

**Solution:**
- Check if input contains SQL/XSS patterns
- Review security logs for malicious input detection
- Adjust sanitization if needed for legitimate use cases

### Issue: Can't access protected endpoint

**Solution:**
1. Verify JWT token is valid: Check expiration
2. Check if `authMiddleware` is applied to route
3. Verify user has required role/permission
4. Check security logs for access denial events

---

## Testing

### Run All Security Tests
```bash
node tests/security.test.js
```

### Test Specific Endpoints
```bash
# Test authentication
node test-both-endpoints.js

# Test integration
node test-security-integration.js

# Test middleware
node test-middleware-imports.js
```

### Manual API Testing with cURL

```powershell
# Test protected endpoint (should fail)
Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method GET

# Test login
$body = @{ email = "admin@example.com"; password = "your-password" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Test with token
$token = "YOUR_JWT_TOKEN"
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method GET -Headers $headers
```

---

## Environment Configuration

Required environment variables (`.env`):

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ocp_docketing

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-256-bits-long
JWT_REFRESH_SECRET=your-different-refresh-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Security
NODE_ENV=production
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
SESSION_TIMEOUT_MINUTES=60

# Logging
SECURITY_LOG_ENABLED=true
SECURITY_LOG_TO_DB=true
SECURITY_LOG_TO_FILE=true
LOG_LEVEL=info

# Server
PORT=5000
```

---

## Emergency Procedures

### Account Lockout

If admin account is locked:

```sql
-- Unlock account
UPDATE account_lockouts 
SET is_active = 0 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com');

-- Clear failed attempts
DELETE FROM login_attempts 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com');
```

### Security Breach Response

1. **Immediate Actions:**
   - Stop the server
   - Disconnect from network if necessary
   - Preserve logs and evidence

2. **Investigation:**
   - Review security logs
   - Check data audit logs
   - Identify compromised accounts

3. **Recovery:**
   - Reset all passwords
   - Invalidate all JWT tokens
   - Patch vulnerabilities
   - Restore from clean backup if needed

4. **Prevention:**
   - Update security policies
   - Add additional controls
   - Document incident

---

## Support

For security issues or questions:
- Review: `COMPREHENSIVE_SECURITY_GUIDE.md`
- Check logs: `logs/security-*.log`
- Query audit tables for details

---

*Quick Reference v1.0 - March 2, 2026*