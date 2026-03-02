const axios = require('axios');

async function testArchivedEndpoint() {
  try {
    console.log('🧪 Testing /api/clearances/archived endpoint...\n');
    
    const response = await axios.get('http://localhost:5000/api/clearances/archived', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.clearances && response.data.clearances.length > 0) {
      console.log('\n✅ SUCCESS: Archived clearances found!');
      console.log('   Count:', response.data.clearances.length);
      response.data.clearances.forEach((clearance, index) => {
        console.log(`   ${index + 1}. ${clearance.or_number} - ${clearance.first_name} ${clearance.last_name}`);
      });
    } else {
      console.log('\n❌ PROBLEM: No archived clearances returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
  
  process.exit(0);
}

testArchivedEndpoint();
