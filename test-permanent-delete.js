const axios = require('axios');

async function testPermanentDelete() {
  console.log('\n🧪 Testing permanent delete endpoint\n');
  
  try {
    // First, get the archived clearances to find one to delete
    console.log('1. Getting archived clearances...');
    const response = await axios.get('http://localhost:5000/api/clearances/archived', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    const archived = response.data.clearances;
    if (archived.length === 0) {
      console.log('❌ No archived clearances to test with');
      process.exit(1);
    }
    
    const clearanceToDelete = archived[0];
    console.log(`   Found: ${clearanceToDelete.or_number} (ID: ${clearanceToDelete.id})\n`);
    
    // Now permanently delete it
    console.log(`2. Permanently deleting ${clearanceToDelete.or_number}...`);
    const deleteResponse = await axios.delete(
      `http://localhost:5000/api/clearances/${clearanceToDelete.id}/permanent`,
      {
        data: {
          deleted_by_user_id: 1,
          deleted_by_name: 'Test User'
        }
      }
    );
    
    console.log('   Status:', deleteResponse.status);
    console.log('   Message:', deleteResponse.data.message);
    console.log('   ✅ SUCCESS!\n');
    
    // Verify it's gone by checking archived list again
    console.log('3. Verifying deletion by checking archived list...');
    const verifyResponse = await axios.get('http://localhost:5000/api/clearances/archived', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    const stillThere = verifyResponse.data.clearances.find(c => c.id === clearanceToDelete.id);
    if (stillThere) {
      console.log('   ❌ Record still exists in database!');
    } else {
      console.log('   ✅ Record successfully removed from database!\n');
      console.log(`   Remaining archived clearances: ${verifyResponse.data.clearances.length}`);
    }
    
  } catch (error) {
    console.log('❌ ERROR');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testPermanentDelete();
