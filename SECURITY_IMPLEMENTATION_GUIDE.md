# 🔒 SECURITY IMPLEMENTATION GUIDE

This guide will help you implement the security fixes identified in the security audit.

---

## 📋 Quick Start

### Step 1: Install Required Dependencies

```bash
npm install jsonwebtoken express-rate-limit helmet csrf cookie-parser
npm install --save-dev @types/jsonwebtoken
```

---

## 🔐 CRITICAL FIXES (Do These First!)

### 1. **Configure Environment Variables**

**Copy `.env.example` to `.env.development` and `.env.production`:**

```bash
# .env.production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_very_secure_password_here
DB_NAME=your_production_db_name
JWT_SECRET=generate_secure_random_string_here
NODE_ENV=production
ADMIN_DEFAULT_PASSWORD=ChangeMe@123456
```

**Generate a secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. **Update server.js**

All the critical changes have been partially implemented. Now you need to:

**Add these at the top of server.js (after imports, before anything else):**

```javascript
// ============================================
// SECURITY: Validate Environment Variables
// ============================================
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please set the following in your .env file:');
    console.error('  DB_HOST=your_host');
    console.error('  DB_USER=your_user');
    console.error('  DB_PASSWORD=your_password');
    console.error('  DB_NAME=your_database');
    process.exit(1);
  }
});

// ============================================
// SECURITY: Load and Configure Middleware
// ============================================
const jwt = require('jsonwebtoken');
const { authMiddleware, authorize } = require('./middleware/authMiddleware');
const { loginLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { securityHeaders, customSecurityHeaders } = require('./middleware/securityHeaders');
```

**Add these middleware to express app (after cors, before routes):**

```javascript
// ============================================
// APPLY SECURITY MIDDLEWARE
// ============================================

// Apply security headers
app.use(securityHeaders());
app.use(customSecurityHeaders);

// Apply rate limiting
app.use(apiLimiter);

// CORS Configuration (restrict origins)
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));
```

---

### 3. **Update Login Endpoint**

**Find this section in server.js (around line 576):**

```javascript
// ❌ OLD: No rate limiting, no JWT
app.post("/api/auth/login", validateRequest(UserLoginSchema), (req, res) => {
  // ...
  res.json(ApiResponse.success("Login successful", userData));
});
```

**Replace with:**

```javascript
// ✅ NEW: With rate limiting and JWT
app.post("/api/auth/login", loginLimiter, validateRequest(UserLoginSchema), (req, res) => {
  const { email, password } = req.body;
  
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error occurred"); // Don't log the actual error to user
      return res.status(500).json(ApiResponse.error("Database error", 500));
    }
    
    if (results.length === 0) {
      return res.status(401).json(ApiResponse.error("Invalid email or password", 401));
    }
    
    const user = results[0];
    
    // Check if account is active
    if (user.is_active === 0) {
      return res.status(403).json(ApiResponse.error("Your account has been deactivated. Please contact the administrator.", 403));
    }
    
    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json(ApiResponse.error("Invalid email or password", 401));
    }
    
    // ✅ NEW: Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update last login
    db.query("UPDATE users SET last_login = NOW(), is_online = 1 WHERE id = ?", [user.id]);
    
    // Return user data with token
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_picture: user.profile_picture,
      created_at: user.created_at
    };
    
    res.json(ApiResponse.success("Login successful", { user: userData, token }));
  });
});
```

---

### 4. **Update Protected Endpoints**

**Find the `/api/user/:id` endpoint and add authentication:**

```javascript
// ❌ OLD: No authentication
app.get("/api/user/:id", (req, res) => {
  const { id } = req.params;
  // ...
});
```

**Replace with:**

```javascript
// ✅ NEW: With authentication and authorization
app.get("/api/user/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // Verify user can only access their own data (unless Admin)
  if (req.user.id !== parseInt(id) && req.user.role !== 'Admin') {
    return res.status(403).json(ApiResponse.error('Forbidden - Cannot access other user data', 403));
  }
  
  db.query("SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error occurred");
      return res.status(500).json(ApiResponse.error("Database error", 500));
    }
    
    if (results.length === 0) {
      return res.status(404).json(ApiResponse.error("User not found", 404));
    }
    
    res.json(ApiResponse.success("User retrieved", { user: results[0] }));
  });
});
```

---

## 🛡️ ADDITIONAL SECURITY ENHANCEMENTS

### 5. **Strong Password Policy**

**Update `src/schemas/users.ts`:**

```typescript
// ❌ WEAK
password: z.string().min(6)

// ✅ STRONG
password: z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")  
  .regex(/[0-9]/, "Must contain number")
  .regex(/[!@#$%^&*]/, "Must contain special character")
```

---

### 6. **Field Whitelisting on Updates**

**For case updates, create an allowlist:**

```javascript
// ✅ Only allow specific fields to be updated
const allowedCaseFields = {
  'OFFENSE': true,
  'DATE_RESOLVED': true,
  'REMARKS_DECISION': true,
  'PENALTY': true
};

app.put("/api/cases/:id", authMiddleware, authorize(['Admin', 'Staff']), (req, res) => {
  const { id } = req.params;
  const updateData = {};
  
  // Only include whitelisted fields
  Object.keys(req.body).forEach(key => {
    if (allowedCaseFields[key]) {
      updateData[key] = req.body[key];
    }
  });
  
  // Don't allow direct ID or critical field updates
  if (updateData.id || updateData.created_at) {
    return res.status(400).json(ApiResponse.error('Cannot update system fields', 400));
  }
  
  // Build safe update query
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return res.status(400).json(ApiResponse.error('No valid fields to update', 400));
  }
  
  const updateClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updateData[f]);
  values.push(id);
  
  db.query(`UPDATE cases SET ${updateClause} WHERE id = ?`, values, (err) => {
    if (err) {
      console.error("Update error");
      return res.status(500).json(ApiResponse.error("Update failed", 500));
    }
    res.json(ApiResponse.success("Case updated successfully"));
  });
});
```

---

### 7. **Audit Logging**

**Create an audit logging function:**

```javascript
const logAudit = (userId, action, tableName, recordId, changes) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, created_at) 
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  
  db.query(query, [
    userId,
    action,
    tableName,
    recordId,
    JSON.stringify(changes)
  ], (err) => {
    if (err) console.error('Audit log error:', err);
  });
};

// Use in your update endpoints:
db.query(updateQuery, values, (err) => {
  if (!err) {
    logAudit(req.user.id, 'UPDATE', 'cases', id, req.body);
  }
});
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1 - Critical
- [ ] Set up `.env` files with secure passwords
- [ ] Install required npm packages
- [ ] Add authentication middleware
- [ ] Update login endpoint with JWT
- [ ] Add authMiddleware to protected endpoints
- [ ] Update user profile endpoint
- [ ] Stop logging sensitive data

### Week 2 - High Priority
- [ ] Add rate limiting middleware
- [ ] Update login endpoint with rate limiter
- [ ] Implement field whitelisting
- [ ] Add security headers middleware
- [ ] Add CSRF protection

### Week 3 - Medium Priority
- [ ] Update password policy schema
- [ ] Implement audit logging
- [ ] Add role-based access control
- [ ] Add input length validation

### Week 4 - Low Priority
- [ ] Add request timeouts
- [ ] Implement connection pooling
- [ ] Add graceful shutdown
- [ ] Add comprehensive error handling

---

## 🧪 TESTING YOUR SECURITY

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:5000/api/auth/login -d '{}'; done

# Test authentication
curl -X GET http://localhost:5000/api/user/1 # Should fail (no token)
curl -X GET http://localhost:5000/api/user/1 -H "Authorization: Bearer INVALID_TOKEN" # Should fail

# Test with valid token
curl -X GET http://localhost:5000/api/user/1 -H "Authorization: Bearer <your_token>" # Should work
```

---

## 📚 IMPORTANT REMINDERS

1. **Never commit `.env` to git** - Already in `.gitignore`
2. **Regenerate JWT_SECRET in production** - Use secure random generation
3. **Use HTTPS in production** - Always
4. **Backup your database** - Before making schema changes
5. **Test thoroughly** - Before deploying to production
6. **Monitor logs** - Watch for suspicious activity
7. **Keep dependencies updated** - Run `npm audit` regularly

---

## ❓ Troubleshooting

**"Cannot find module 'jsonwebtoken'"**
```bash
npm install jsonwebtoken
```

**"DB_PASSWORD not set"**
```bash
# Create or update your .env file with:
DB_PASSWORD=your_secure_password
```

**"JWT verification failed"**
- Ensure JWT_SECRET is the same on frontend and backend
- Check token hasn't expired
- Verify token format is correct

---

**Need Help?** Check the SECURITY_AUDIT_REPORT.md for more details on each vulnerability.
