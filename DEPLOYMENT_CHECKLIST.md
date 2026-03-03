# 🚀 Production Deployment Checklist

## Pre-Deployment Security Checklist

### ✅ Phase 1: Code & Configuration (COMPLETE)
- [x] Security middleware integrated (`sanitize.js`, `rbac.js`)
- [x] All protected endpoints have `authMiddleware`
- [x] Security logging implemented
- [x] Strong password policy enforced
- [x] Input validation on all user inputs
- [x] Database audit tables created

### ✅ Phase 2: Database Setup (TO VERIFY)
- [ ] Run migration: `Get-Content database/migration_security_audit.sql | C:\xampp\mysql\bin\mysql.exe -u root -p ocp_docketing`
- [ ] Verify tables created:
  ```sql
  SHOW TABLES LIKE '%audit%';
  SHOW TABLES LIKE '%login%';
  ```
- [ ] Test stored procedures work:
  ```sql
  CALL sp_log_security_event(1, 'TEST_EVENT', 'INFO', 'Test', '127.0.0.1', NULL);
  SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 1;
  ```

### 🔄 Phase 3: Environment Configuration (REQUIRED)
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Generate strong JWT secrets:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database credentials
- [ ] Set appropriate `JWT_EXPIRE` time (recommended: 15m-1h)
- [ ] Enable all security logging flags

### 📋 Phase 4: Testing (REQUIRED)
- [x] Authentication tests pass (`node test-both-endpoints.js`)
- [ ] Security test suite passes (`node tests/security.test.js`)
- [ ] Manual login/logout works
- [ ] Protected endpoints block unauthorized access
- [ ] Security logs are being written
- [ ] Password policy rejects weak passwords
- [ ] File upload sanitization works

### 🔒 Phase 5: HTTPS Setup (CRITICAL FOR PRODUCTION)
- [ ] Obtain SSL/TLS certificate (Let's Encrypt recommended)
- [ ] Configure reverse proxy (Nginx/Apache/IIS)
- [ ] Force HTTPS redirect
- [ ] Enable HSTS headers
- [ ] Update CORS origins to HTTPS URLs
- [ ] Test certificate validity

### 🛡️ Phase 6: Additional Security Hardening
- [ ] Install and configure Helmet.js middleware
- [ ] Enable rate limiting on all endpoints
- [ ] Set up fail2ban or equivalent
- [ ] Configure firewall rules
- [ ] Disable unnecessary services
- [ ] Set proper file permissions (uploads folder)
- [ ] Remove development dependencies

### 📊 Phase 7: Monitoring Setup
- [ ] Configure log rotation (daily recommended)
- [ ] Set up log monitoring/alerting
- [ ] Create security dashboard
- [ ] Configure automated backups
- [ ] Set up uptime monitoring
- [ ] Configure error reporting

### 🧪 Phase 8: Final Pre-Launch Tests
- [ ] Run full security test suite
- [ ] Perform penetration testing
- [ ] Load testing
- [ ] Backup and restore test
- [ ] Disaster recovery drill
- [ ] User acceptance testing

---

## Quick Start Commands

### 1. Database Migration
```powershell
# PowerShell (Windows)
Get-Content database/migration_security_audit.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p ocp_docketing

# Verify
& "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "USE ocp_docketing; SHOW TABLES LIKE '%audit%'; SHOW TABLES LIKE '%login%';"
```

### 2. Environment Setup
```bash
# Copy example file
cp .env.example .env

# Edit .env file with your settings
# IMPORTANT: Change all secrets and passwords!
```

### 3. Security Tests
```bash
# Run all security tests
node tests/security.test.js

# Quick integration test
node test-both-endpoints.js

# Middleware verification
node test-middleware-imports.js
```

### 4. Start Production Server
```bash
# With environment variable
NODE_ENV=production node server.js

# Or use PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "ocp-docketing" --env production
pm2 save
pm2 startup
```

---

## Environment Variables Reference

### Required (.env file)
```env
# Database
DB_HOST=localhost
DB_USER=root  
DB_PASSWORD=your_secure_password_here
DB_NAME=ocp_docketing
DB_PORT=3306

# JWT Configuration (CHANGE THESE!)
JWT_SECRET=GENERATE_NEW_SECRET_HERE_64_CHARS_MIN
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_SECRET_HERE
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
LOG_DIR=./logs

# Server
PORT=5000
FRONTEND_URL=https://yourdomain.com

# File Uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Generate Secrets
```bash
# JWT Secret (run this command)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (run this command)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

---

## Security Files Summary

### Core Security Files
| File | Purpose | Status |
|------|---------|--------|
| `middleware/rbac.js` | Role-based access control | ✅ Active |
| `middleware/sanitize.js` | Input sanitization | ✅ Active |
| `middleware/authMiddleware.js` | JWT authentication | ✅ Active |
| `utils/securityLogger.js` | Security logging | ✅ Active |
| `database/migration_security_audit.sql` | Audit tables | ⏳ Run migration |

### Documentation Files
| File | Purpose |
|------|---------|
| `COMPREHENSIVE_SECURITY_GUIDE.md` | Full implementation guide |
| `SECURITY_IMPLEMENTATION_COMPLETE.md` | Completion summary |
| `SECURITY_QUICK_REFERENCE.md` | Developer quick reference |
| `DEPLOYMENT_CHECKLIST.md` | This file |

### Test Files (can be deleted after testing)
| File | Purpose |
|------|---------|
| `tests/security.test.js` | Automated security tests (KEEP) |
| `test-both-endpoints.js` | Endpoint auth testing (DELETE AFTER) |
| `test-security-integration.js` | Integration testing (DELETE AFTER) |
| `test-middleware-imports.js` | Middleware testing (DELETE AFTER) |
| `test-auth-debug.js` | Auth debugging (DELETE AFTER) |
| `detailed-security-test.js` | Detailed testing (DELETE AFTER) |
| `run_migration.bat` | Migration helper (DELETE AFTER) |

---

## Post-Deployment Monitoring

### Daily Tasks
```bash
# Check security logs
Get-Content logs/security-$(Get-Date -Format "yyyy-MM-dd").log -Tail 50

# Check for failed logins
& "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "USE ocp_docketing; SELECT * FROM login_attempts WHERE success = 0 AND attempt_time >= CURDATE();"

# Check locked accounts
& "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "USE ocp_docketing; SELECT * FROM account_lockouts WHERE is_active = 1;"
```

### Weekly Tasks
```sql
-- Review security events
SELECT event_type, COUNT(*) as count 
FROM security_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type 
ORDER BY count DESC;

-- Check data modifications
SELECT action, table_name, COUNT(*) as count
FROM data_audit_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY action, table_name;
```

---

## Troubleshooting Production Issues

### Server Won't Start
```bash
# Check if port is in use
netstat -ano | Select-String ":5000.*LISTENING"

# Kill process if needed
Stop-Process -Id <PID> -Force

# Check logs for errors
Get-Content logs/error.log -Tail 50
```

### Database Connection Issues
```bash
# Test database connection
& "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "USE ocp_docketing; SELECT 1;"

# Check database user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'your_db_user'@'localhost';"
```

### Authentication Not Working
1. Check JWT_SECRET is set in .env
2. Verify token expiration time
3. Check authMiddleware is applied to routes
4. Review security logs for details

### Permissions Issues
```sql
-- Check user roles
SELECT id, name, email, role FROM users WHERE email = 'user@example.com';

-- Verify RBAC permissions in middleware/rbac.js
```

---

## Rollback Plan

If you need to rollback security changes:

### 1. Database Rollback
```sql
-- Drop audit tables (if needed)
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS account_lockouts;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS data_audit_log;
DROP TABLE IF EXISTS security_audit_log;
```

### 2. Code Rollback
```bash
# Revert to previous version
git log --oneline -10  # Find commit before security changes
git revert <commit-hash>

# Or checkout previous version
git checkout <commit-hash> server.js
```

---

## Success Criteria

### ✅ Deployment is successful when:
- [ ] Server starts without errors
- [ ] All tests pass
- [ ] Database migration completed
- [ ] HTTPS is working
- [ ] Protected endpoints require authentication
- [ ] Security logs are being written
- [ ] Users can login successfully
- [ ] Unauthorized access is blocked
- [ ] No console errors in production

### 🎯 Production Ready Checklist
- [ ] All environment variables configured
- [ ] Database migration completed
- [ ] HTTPS enabled
- [ ] Security logs monitored
- [ ] Backups configured
- [ ] Documentation reviewed
- [ ] Team trained on security features
- [ ] Incident response plan in place

---

## Support Contacts

### Internal Team
- **Developer:** [Your Name]
- **System Admin:** [Admin Name]
- **Security Officer:** [Security Contact]

### Emergency Procedures
1. If security breach detected: Stop server immediately
2. Preserve all logs
3. Contact security officer
4. Follow incident response plan

---

## Next Review Date
Schedule security review for: **[Date + 3 months]**

Review items:
- Security log analysis
- Permission audit
- Vulnerability scan
- Dependency updates
- Documentation updates

---

*Last Updated: March 2, 2026*  
*Version: 1.0.0*