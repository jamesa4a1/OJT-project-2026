// Test script to simulate the exact frontend API call
const axios = require('axios');

async function testRestoreAPI() {
  console.log('=== Testing Restore API Call ===');
  
  try {
    // Test with a deleted case docket number
    const testDocketNo = 'TEST-RESTORE-002'; // Use the new test case
    
    console.log('Making API call to restore case:', testDocketNo);
    console.log('URL: http://localhost:5000/restore-case');
    console.log('Method: PATCH');
    console.log('Body:', { docket_no: testDocketNo });
    
    const response = await axios.patch('http://localhost:5000/restore-case', {
      docket_no: testDocketNo
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    console.error('Request Config:', {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data
    });
  }
}

// Run the test
testRestoreAPI();