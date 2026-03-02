const axios = require('axios');

async function testArchived() {
  console.log('\n🧪 Detailed test of archived endpoint\n');
  
  try {
    console.log('Request URL: http://localhost:5000/api/clearances/archived?page=1&limit=10');
    console.log('Request method: GET\n');
    
    const response = await axios.get('http://localhost:5000/api/clearances/archived', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    console.log('\nFull Error:', error.message);
  }
}

testArchived();
