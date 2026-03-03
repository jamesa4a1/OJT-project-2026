/**
 * Security Test Suite
 * 
 * Comprehensive security tests for the OCP Docketing System.
 * Run with: node tests/security.test.js
 * 
 * Tests cover:
 * - Authentication & Authorization
 * - Input validation (SQL Injection, XSS)
 * - Rate limiting
 * - Security headers
 * - Access control
 */

const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:5000',
  timeout: 10000,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  debug: (msg) => CONFIG.verbose && console.log(`${colors.dim}  ${msg}${colors.reset}`)
};

/**
 * Make HTTP request
 */
const makeRequest = (method, path, data = null, headers = {}) => {
  return new Promise((resolve) => {
    const url = new URL(path, CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: CONFIG.timeout
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedBody
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({ status: 0, error: error.message, data: null });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'Request timeout', data: null });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Assert helper
 */
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

/**
 * Run a single test
 */
const runTest = async (name, testFn) => {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'passed' });
    log.pass(name);
    return true;
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    log.fail(`${name}\n    ${colors.dim}Error: ${error.message}${colors.reset}`);
    return false;
  }
};

/**
 * Skip a test
 */
const skipTest = (name, reason) => {
  results.skipped++;
  results.tests.push({ name, status: 'skipped', reason });
  log.warn(`${name} (skipped: ${reason})`);
};

// =====================================================
// TEST SUITES
// =====================================================

/**
 * Authentication Tests
 */
const authenticationTests = {
  async testLoginEndpointExists() {
    const res = await makeRequest('POST', '/api/auth/login', {});
    assert(res.status !== 404, 'Login endpoint should exist');
    assert(res.status !== 0, 'Server should be reachable');
  },
  
  async testLoginRequiresCredentials() {
    const res = await makeRequest('POST', '/api/auth/login', {});
    assert(res.status === 400 || res.status === 401, 
      `Should reject empty login (got ${res.status})`);
  },
  
  async testLoginRejectsInvalidEmail() {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'invalidemail',
      password: 'password123'
    });
    assert(res.status === 400 || res.status === 401, 
      'Should reject invalid email format');
  },
  
  async testLoginRejectsWrongPassword() {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    assert(res.status === 401, 'Should reject wrong password with 401');
  },
  
  async testNoUserEnumeration() {
    // Same response for non-existent user and wrong password
    const nonExistent = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    
    const wrongPassword = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'wrongpassword'
    });
    
    // Both should return 401 with similar message
    assert(nonExistent.status === 401 && wrongPassword.status === 401,
      'Both should return 401 to prevent user enumeration');
  }
};

/**
 * SQL Injection Tests
 */
const sqlInjectionTests = {
  async testBasicSqlInjection() {
    const payloads = [
      "'; DROP TABLE users; --",
      "1 OR 1=1",
      "admin'--",
      "1; SELECT * FROM users",
      "' UNION SELECT * FROM users --",
      "1' AND '1'='1",
      "1; DELETE FROM users WHERE '1'='1"
    ];
    
    for (const payload of payloads) {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: payload,
        password: 'test'
      });
      log.debug(`SQL injection payload: ${payload} -> ${res.status}`);
      assert(
        res.status === 400 || res.status === 401,
        `SQL injection should be rejected: "${payload.substring(0, 30)}..."`
      );
    }
  },
  
  async testSqlInjectionInSearch() {
    const res = await makeRequest('GET', "/get-case?docket_no='; DROP TABLE cases; --");
    assert(
      res.status === 400 || res.status === 401 || res.status === 404,
      'SQL injection in search should be rejected'
    );
  },
  
  async testSqlInjectionInParams() {
    const res = await makeRequest('GET', "/api/user/1' OR '1'='1");
    assert(
      res.status === 400 || res.status === 401 || res.status === 404,
      'SQL injection in URL params should be rejected'
    );
  }
};

/**
 * XSS Prevention Tests
 */
const xssTests = {
  async testBasicXssInLogin() {
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '<body onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ];
    
    for (const payload of payloads) {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: payload,
        password: 'test'
      });
      log.debug(`XSS payload: ${payload.substring(0, 30)} -> ${res.status}`);
      assert(
        res.status === 400 || res.status === 401,
        `XSS should be rejected: "${payload.substring(0, 30)}..."`
      );
    }
  },
  
  async testXssInCaseData() {
    const res = await makeRequest('POST', '/add-case', {
      DOCKET_NO: '<script>alert("XSS")</script>',
      COMPLAINANT: 'Test',
      RESPONDENT: 'Test',
      OFFENSE: 'Test'
    });
    // Should either reject or sanitize (status depends on auth)
    log.debug(`XSS in case data: ${res.status}`);
    assert(
      res.status === 400 || res.status === 401,
      'XSS in case data should be rejected or require auth'
    );
  }
};

/**
 * Authorization Tests
 */
const authorizationTests = {
  async testProtectedEndpointsRequireAuth() {
    const protectedEndpoints = [
      { method: 'GET', path: '/api/users' },
      { method: 'DELETE', path: '/api/user/1' },
      { method: 'PUT', path: '/api/user/1/toggle-status' },
      { method: 'GET', path: '/api/user/1' },
    ];
    
    for (const endpoint of protectedEndpoints) {
      const res = await makeRequest(endpoint.method, endpoint.path);
      log.debug(`${endpoint.method} ${endpoint.path}: ${res.status}`);
      assert(
        res.status === 401 || res.status === 403,
        `${endpoint.method} ${endpoint.path} should require auth (got ${res.status})`
      );
    }
  },
  
  async testInvalidTokenRejected() {
    const res = await makeRequest('GET', '/api/users', null, {
      'Authorization': 'Bearer invalid_token_here'
    });
    assert(res.status === 401, 'Invalid token should be rejected');
  },
  
  async testMalformedAuthHeader() {
    const headers = [
      { 'Authorization': 'Bearer' },
      { 'Authorization': 'Basic dXNlcjpwYXNz' },
      { 'Authorization': 'InvalidScheme token123' }
    ];
    
    for (const header of headers) {
      const res = await makeRequest('GET', '/api/users', null, header);
      assert(
        res.status === 401,
        `Malformed auth header should be rejected: ${JSON.stringify(header)}`
      );
    }
  }
};

/**
 * Rate Limiting Tests
 */
const rateLimitingTests = {
  async testLoginRateLimiting() {
    log.info('Testing login rate limiting (this may take a few seconds)...');
    
    const attempts = [];
    const testEmail = `ratelimit-test-${Date.now()}@example.com`;
    
    // Make rapid login attempts
    for (let i = 0; i < 10; i++) {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmail,
        password: 'wrongpassword'
      });
      attempts.push(res.status);
      log.debug(`Attempt ${i + 1}: ${res.status}`);
    }
    
    // Should get 429 (Too Many Requests) at some point
    const rateLimited = attempts.includes(429);
    
    if (!rateLimited) {
      log.warn('Rate limiting may not be enabled or limit is > 10');
    }
    
    assert(
      rateLimited || attempts.every(s => s === 401),
      'Either rate limiting should kick in or all should be 401'
    );
  }
};

/**
 * Security Headers Tests
 */
const securityHeadersTests = {
  async testSecurityHeadersPresent() {
    const res = await makeRequest('GET', '/');
    const headers = res.headers || {};
    
    const expectedHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN']
    };
    
    for (const [header, expected] of Object.entries(expectedHeaders)) {
      const value = headers[header];
      log.debug(`Header ${header}: ${value}`);
      
      if (Array.isArray(expected)) {
        assert(
          expected.some(e => value?.toUpperCase().includes(e)),
          `Security header ${header} should be set`
        );
      } else {
        assert(
          value?.toLowerCase().includes(expected.toLowerCase()),
          `Security header ${header} should be "${expected}"`
        );
      }
    }
  },
  
  async testNoServerVersionExposed() {
    const res = await makeRequest('GET', '/');
    const server = res.headers?.['server'];
    
    if (server) {
      assert(
        !server.match(/\d+\.\d+/),
        'Server header should not expose version numbers'
      );
    }
  },
  
  async testCorsConfiguration() {
    const res = await makeRequest('OPTIONS', '/api/auth/login', null, {
      'Origin': 'https://evil-site.com',
      'Access-Control-Request-Method': 'POST'
    });
    
    const allowedOrigin = res.headers?.['access-control-allow-origin'];
    log.debug(`CORS allowed origin: ${allowedOrigin}`);
    
    assert(
      !allowedOrigin || allowedOrigin !== 'https://evil-site.com' && allowedOrigin !== '*',
      'CORS should not allow arbitrary origins'
    );
  }
};

/**
 * Input Validation Tests
 */
const inputValidationTests = {
  async testOversizedPayloadRejected() {
    // Create a large payload (~10MB)
    const largeString = 'x'.repeat(10 * 1024 * 1024);
    
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: largeString
    });
    
    // Should be rejected (413 Payload Too Large, 400 Bad Request, or connection error)
    assert(
      res.status === 413 || res.status === 400 || res.status === 0,
      'Oversized payload should be rejected'
    );
  },
  
  async testNullByteInjection() {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test\x00@example.com',
      password: 'password'
    });
    
    assert(
      res.status === 400 || res.status === 401,
      'Null byte injection should be rejected'
    );
  },
  
  async testUnicodeNormalization() {
    // Test unicode normalization attacks
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'test\u0041\u030A@example.com', // A with combining ring
      password: 'password'
    });
    
    assert(
      res.status === 400 || res.status === 401,
      'Malformed unicode should be handled safely'
    );
  }
};

/**
 * Path Traversal Tests
 */
const pathTraversalTests = {
  async testPathTraversalInDownload() {
    const payloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '%2e%2e%2f%2e%2e%2f',
      '....//....//etc/passwd'
    ];
    
    for (const payload of payloads) {
      const res = await makeRequest('GET', `/download/index-card/${payload}`);
      log.debug(`Path traversal: ${payload} -> ${res.status}`);
      
      assert(
        res.status === 400 || res.status === 404 || res.status === 403,
        `Path traversal should be blocked: ${payload}`
      );
    }
  },
  
  async testPathTraversalInStatic() {
    const res = await makeRequest('GET', '/uploads/../server.js');
    
    assert(
      res.status === 400 || res.status === 404 || res.status === 403,
      'Path traversal in static files should be blocked'
    );
  }
};

// =====================================================
// MAIN TEST RUNNER
// =====================================================

const runAllTests = async () => {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}🔒 SECURITY TEST SUITE${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Target: ${CONFIG.baseUrl}`);
  console.log(`Verbose: ${CONFIG.verbose}`);
  console.log('='.repeat(60) + '\n');
  
  // Check server connectivity
  log.info('Checking server connectivity...');
  const healthCheck = await makeRequest('GET', '/');
  if (healthCheck.status === 0) {
    log.fail(`Cannot connect to server at ${CONFIG.baseUrl}`);
    log.info('Make sure the server is running: node server.js');
    process.exit(1);
  }
  log.pass(`Server is reachable (status: ${healthCheck.status})\n`);
  
  // Run test suites
  const suites = [
    { name: 'Authentication', tests: authenticationTests },
    { name: 'SQL Injection Prevention', tests: sqlInjectionTests },
    { name: 'XSS Prevention', tests: xssTests },
    { name: 'Authorization', tests: authorizationTests },
    { name: 'Rate Limiting', tests: rateLimitingTests },
    { name: 'Security Headers', tests: securityHeadersTests },
    { name: 'Input Validation', tests: inputValidationTests },
    { name: 'Path Traversal Prevention', tests: pathTraversalTests }
  ];
  
  for (const suite of suites) {
    console.log(`\n${colors.cyan}▸ ${suite.name}${colors.reset}`);
    
    for (const [testName, testFn] of Object.entries(suite.tests)) {
      // Convert camelCase to readable name
      const readableName = testName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^test /, '')
        .trim();
      
      await runTest(readableName, testFn);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.green}Passed:${colors.reset}  ${results.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}  ${results.failed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${results.skipped}`);
  console.log(`Total:   ${results.passed + results.failed + results.skipped}`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log(`\n${colors.red}⚠ Some security tests failed!${colors.reset}`);
    console.log('Review the failed tests and implement necessary fixes.\n');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✓ All security tests passed!${colors.reset}\n`);
    process.exit(0);
  }
};

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
