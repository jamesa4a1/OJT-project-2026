const axios = require('axios');

async function detailedSecurityTest() {
  console.log('🔍 Detailed Security Integration Test\n');
  
  try {
    // Detailed test of /api/users endpoint
    console.log('📋 Testing /api/users endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      console.log(`❌ CRITICAL: Endpoint accessible without auth!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data type: ${typeof response.data}`);
      console.log(`   First few chars: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`✅ PASS: Endpoint properly protected`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test login endpoint (should be accessible)
    console.log('\n🔑 Testing /api/auth/login endpoint...');
    try {
      await axios.post('http://localhost:5000/api/auth/login', {
        email: 'invalid@test.com',
        password: 'invalid'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Login endpoint accessible, properly rejects invalid credentials');
      } else {
        console.log(`ℹ️  Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
      }
    }

    // Test server root
    console.log('\n🌐 Testing server root...');
    try {
      const response = await axios.get('http://localhost:5000/');
      console.log(`✅ Server root accessible (${response.status})`);
    } catch (error) {
      console.log(`❌ Server root error: ${error.code || error.message}`);
    }

  } catch (error) {
    console.error('❌ Test framework error:', error.message);
  }
}

detailedSecurityTest();