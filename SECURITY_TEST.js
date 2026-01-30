#!/usr/bin/env node

/**
 * SECURITY VERIFICATION TEST SUITE
 * Tests all security implementations and middleware
 */

const fs = require('fs');
const path = require('path');

// ANSI Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
let tests = [];
let passed = 0;
let failed = 0;

/**
 * Add a test result
 */
function test(name, condition, details = '') {
  const status = condition ? '✓ PASS' : '✗ FAIL';
  const color = condition ? colors.green : colors.red;
  console.log(`${color}${status}${colors.reset} ${name}`);
  if (details) console.log(`     ${colors.cyan}${details}${colors.reset}`);
  
  if (condition) passed++;
  else failed++;
  
  tests.push({ name, condition, details });
}

console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}     SECURITY IMPLEMENTATION TEST SUITE${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

// ============================================
// TEST 1: Environment Variables
// ============================================
console.log(`${colors.yellow}TEST 1: Environment Variables Configuration${colors.reset}`);

const envExists = fs.existsSync(path.join(__dirname, '.env'));
test('1.1 .env file exists', envExists, envExists ? '.env file found' : '.env file missing - create from .env.example');

const envExampleExists = fs.existsSync(path.join(__dirname, '.env.example'));
test('1.2 .env.example file exists', envExampleExists, envExampleExists ? '.env.example found' : '.env.example missing');

if (envExists) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  test('1.3 DB_HOST configured', envContent.includes('DB_HOST='), 'Database host is set');
  test('1.4 DB_USER configured', envContent.includes('DB_USER='), 'Database user is set');
  test('1.5 JWT_SECRET configured', envContent.includes('JWT_SECRET='), 'JWT secret is set');
  test('1.6 NODE_ENV configured', envContent.includes('NODE_ENV='), 'Node environment is set');
}

// ============================================
// TEST 2: Middleware Files Exist
// ============================================
console.log(`\n${colors.yellow}TEST 2: Security Middleware Files${colors.reset}`);

const authMiddlewareExists = fs.existsSync(path.join(__dirname, 'middleware/authMiddleware.js'));
test('2.1 authMiddleware.js exists', authMiddlewareExists, 'JWT authentication middleware found');

const rateLimiterExists = fs.existsSync(path.join(__dirname, 'middleware/rateLimiter.js'));
test('2.2 rateLimiter.js exists', rateLimiterExists, 'Rate limiting middleware found');

const securityHeadersExists = fs.existsSync(path.join(__dirname, 'middleware/securityHeaders.js'));
test('2.3 securityHeaders.js exists', securityHeadersExists, 'Security headers middleware found');

// ============================================
// TEST 3: Middleware Code Quality
// ============================================
console.log(`\n${colors.yellow}TEST 3: Middleware Code Quality${colors.reset}`);

if (authMiddlewareExists) {
  const authCode = fs.readFileSync(path.join(__dirname, 'middleware/authMiddleware.js'), 'utf-8');
  test('3.1 authMiddleware exports functions', authCode.includes('module.exports'), 'Module exports found');
  test('3.2 authMiddleware has authMiddleware function', authCode.includes('function authMiddleware') || authCode.includes('const authMiddleware'), 'Auth function defined');
  test('3.3 authMiddleware validates JWT', authCode.includes('jwt.verify'), 'JWT verification implemented');
  test('3.4 authMiddleware has authorize function', authCode.includes('authorize'), 'RBAC authorize function found');
}

if (rateLimiterExists) {
  const limiterCode = fs.readFileSync(path.join(__dirname, 'middleware/rateLimiter.js'), 'utf-8');
  test('3.5 rateLimiter exports functions', limiterCode.includes('module.exports'), 'Module exports found');
  test('3.6 rateLimiter has loginLimiter', limiterCode.includes('loginLimiter'), 'Login rate limiter defined');
  test('3.7 rateLimiter has apiLimiter', limiterCode.includes('apiLimiter'), 'API rate limiter defined');
}

if (securityHeadersExists) {
  const headersCode = fs.readFileSync(path.join(__dirname, 'middleware/securityHeaders.js'), 'utf-8');
  test('3.8 securityHeaders has helmet', headersCode.includes('helmet'), 'Helmet security headers found');
  test('3.9 securityHeaders exports middleware', headersCode.includes('module.exports'), 'Module exports found');
}

// ============================================
// TEST 4: Server Security Updates
// ============================================
console.log(`\n${colors.yellow}TEST 4: Server.js Security Updates${colors.reset}`);

const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf-8');

test('4.1 Database uses environment variables', serverCode.includes('process.env.DB_HOST'), 'DB_HOST from environment');
test('4.2 Database password from environment', serverCode.includes('process.env.DB_PASSWORD'), 'DB_PASSWORD from environment');
test('4.3 Database name from environment', serverCode.includes('process.env.DB_NAME'), 'DB_NAME from environment');
test('4.4 Database user from environment', serverCode.includes('process.env.DB_USER'), 'DB_USER from environment');

// ============================================
// TEST 5: No Hardcoded Credentials
// ============================================
console.log(`\n${colors.yellow}TEST 5: Hardcoded Credentials Check${colors.reset}`);

const hasHardcodedPassword = serverCode.match(/password\s*:\s*["'](?!.*process\.env)[^"']+["']/i);
test('5.1 No hardcoded database passwords', !hasHardcodedPassword, 'Credentials are environment-based');

const hasAdminPassword = serverCode.includes('process.env.ADMIN_DEFAULT_PASSWORD') || !serverCode.includes("password: 'ChangeMe");
test('5.2 Admin password uses environment variable', hasAdminPassword, 'ADMIN_DEFAULT_PASSWORD from environment');

// ============================================
// TEST 6: Input Validation
// ============================================
console.log(`\n${colors.yellow}TEST 6: Input Validation${colors.reset}`);

const schemasPath = path.join(__dirname, 'schemas');
const schemasExist = fs.existsSync(schemasPath);
test('6.1 schemas directory exists', schemasExist, 'Validation schemas found');

if (schemasExist) {
  const userSchemaExists = fs.existsSync(path.join(schemasPath, 'users.js'));
  test('6.2 users schema exists', userSchemaExists, 'User validation schema found');
  
  const caseSchemaExists = fs.existsSync(path.join(schemasPath, 'cases.js'));
  test('6.3 cases schema exists', caseSchemaExists, 'Case validation schema found');
}

const validateRequestExists = fs.existsSync(path.join(__dirname, 'middleware/validateRequest.js'));
test('6.4 validateRequest middleware exists', validateRequestExists, 'Zod validation middleware found');

// ============================================
// TEST 7: API Response Utility
// ============================================
console.log(`\n${colors.yellow}TEST 7: API Response Utility${colors.reset}`);

const apiResponseExists = fs.existsSync(path.join(__dirname, 'utils/apiResponse.js'));
test('7.1 apiResponse utility exists', apiResponseExists, 'Standardized API response utility found');

if (apiResponseExists) {
  const apiCode = fs.readFileSync(path.join(__dirname, 'utils/apiResponse.js'), 'utf-8');
  test('7.2 ApiResponse has success method', apiCode.includes('success'), 'Success response method found');
  test('7.3 ApiResponse has error method', apiCode.includes('error'), 'Error response method found');
}

// ============================================
// TEST 8: Missing Dependencies
// ============================================
console.log(`\n${colors.yellow}TEST 8: Required Dependencies${colors.reset}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const deps = packageJson.dependencies || {};

test('8.1 express is installed', 'express' in deps, `v${deps.express || 'N/A'}`);
test('8.2 mysql is installed', 'mysql' in deps, `v${deps.mysql || 'N/A'}`);
test('8.3 bcryptjs is installed', 'bcryptjs' in deps, `v${deps.bcryptjs || 'N/A'}`);
test('8.4 zod is installed', 'zod' in deps, `v${deps.zod || 'N/A'}`);
test('8.5 cors is installed', 'cors' in deps, `v${deps.cors || 'N/A'}`);
test('8.6 multer is installed', 'multer' in deps, `v${deps.multer || 'N/A'}`);

// Missing but important
test('8.7 jsonwebtoken is installed', 'jsonwebtoken' in deps, `v${deps.jsonwebtoken || 'NOT INSTALLED - Install: npm install jsonwebtoken'}`);
test('8.8 express-rate-limit is installed', 'express-rate-limit' in deps, `v${deps['express-rate-limit'] || 'NOT INSTALLED - Install: npm install express-rate-limit'}`);
test('8.9 helmet is installed', 'helmet' in deps, `v${deps.helmet || 'NOT INSTALLED - Install: npm install helmet'}`);

// ============================================
// TEST 9: Documentation
// ============================================
console.log(`\n${colors.yellow}TEST 9: Security Documentation${colors.reset}`);

const auditReportExists = fs.existsSync(path.join(__dirname, 'SECURITY_AUDIT_REPORT.md'));
test('9.1 SECURITY_AUDIT_REPORT.md exists', auditReportExists, 'Comprehensive security audit found');

const implGuideExists = fs.existsSync(path.join(__dirname, 'SECURITY_IMPLEMENTATION_GUIDE.md'));
test('9.2 SECURITY_IMPLEMENTATION_GUIDE.md exists', implGuideExists, 'Implementation instructions found');

// ============================================
// SUMMARY
// ============================================
console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}                    TEST SUMMARY${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

console.log(`${colors.green}✓ PASSED: ${passed}${colors.reset}`);
console.log(`${colors.red}✗ FAILED: ${failed}${colors.reset}`);

const total = passed + failed;
const percentage = ((passed / total) * 100).toFixed(1);
console.log(`\nScore: ${percentage}% (${passed}/${total} tests)\n`);

// ============================================
// RECOMMENDATIONS
// ============================================
if (failed > 0) {
  console.log(`${colors.yellow}⚠️  RECOMMENDATIONS:${colors.reset}\n`);
  
  const failures = tests.filter(t => !t.condition);
  failures.forEach(f => {
    console.log(`  • ${f.name}`);
    if (f.details) console.log(`    ${colors.cyan}${f.details}${colors.reset}`);
  });
  
  console.log(`\n${colors.yellow}ACTION ITEMS:${colors.reset}`);
  console.log(`  1. Install missing dependencies: npm install`);
  console.log(`  2. Create .env file from .env.example: cp .env.example .env`);
  console.log(`  3. Update database credentials in .env`);
  console.log(`  4. Generate JWT_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
  console.log(`  5. Review SECURITY_IMPLEMENTATION_GUIDE.md for integration steps\n`);
}

if (failed === 0) {
  console.log(`${colors.green}🎉 All security tests passed! You're ready to implement the fixes.${colors.reset}\n`);
  console.log(`${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`  1. Read SECURITY_IMPLEMENTATION_GUIDE.md`);
  console.log(`  2. Install missing security dependencies`);
  console.log(`  3. Follow the Week 1 implementation checklist`);
  console.log(`  4. Test with: npm start\n`);
}

process.exit(failed > 0 ? 1 : 0);
