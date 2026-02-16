const axios = require('axios');

// Test the archived clearances endpoint
async function testArchivedEndpoint() {
  try {
    console.log('Testing archived clearances endpoint...');
    const response = await axios.get('http://localhost:5000/api/clearances/archived?page=1&limit=10');
    console.log('\nAPI Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Cannot connect to server on port 5000');
      console.error('Is the server running? Check if it\'s on a different port.');
    } else {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

testArchivedEndpoint();
