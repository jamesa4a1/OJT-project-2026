const axios = require('axios');

async function testBothEndpoints() {
  console. log('🔍 Testing both endpoints...\n');
  
  // Test new security-test endpoint
  console.log('1️⃣  Testing /api/security-test (should be blocked)');
  try {
    const response = await axios.get('http://localhost:5000/api/security-test');
    console.log(`❌ FAIL: Accessible without auth - ${response.status}`);
  } catch (error) {
    console.log(`✅ ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }
  
  // Test users endpoint again  
  console.log('\n2️⃣  Testing /api/users (should be blocked)');
  try {
    const response = await axios.get('http://localhost:5000/api/users');
    console.log(`❌ FAIL: Accessible without auth - ${response.status}`);
    console.log(`   Returned ${response.data.users?.length} users`);
  } catch (error) {
    console.log(`✅ ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }
}

testBothEndpoints();