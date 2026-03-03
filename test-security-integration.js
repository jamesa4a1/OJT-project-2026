const axios = require('axios');

async function testSecurityIntegration() {
  console.log('🧪 Testing Security Integration...\n');
  
  try {
    // Test 1: Try to access protected endpoint without authentication
    console.log('📋 Test 1: Access protected endpoint without auth');
    try {
      await axios.get('http://localhost:5000/api/users');
      console.log('❌ FAIL: Should have been blocked');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Request blocked (401 Unauthorized)');
      } else {
        console.log(`ℹ️  Response: ${error.response?.status} - ${error.message}`);
      }
    }
    
    // Test 2: Test input sanitization
    console.log('\n🧼 Test 2: Input sanitization');
    try {
      const maliciousInput = { 
        name: '<script>alert("xss")</script>',
        email: 'test@test.com'
      };
      await axios.post('http://localhost:5000/api/auth/register', maliciousInput);
    } catch (error) {
      console.log(`ℹ️  Sanitization test: ${error.response?.status || 'Connection error'}`);
    }
    
    // Test 3: Server health check
    console.log('\n❤️  Test 3: Server health');
    try {
      const response = await axios.get('http://localhost:5000/');
      console.log('✅ Server is responding');
    } catch (error) {
      console.log(`❌ Server connection error: ${error.code || error.message}`);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testSecurityIntegration();