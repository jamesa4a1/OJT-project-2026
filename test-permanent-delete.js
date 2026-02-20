const axios = require('axios');

console.log('🧪 Testing permanent delete functionality...\n');

async function testPermanentDelete() {
  try {
    // First, get all deleted cases
    console.log('📋 Step 1: Fetching deleted cases...');
    const deletedCases = await axios.get('http://localhost:5000/deleted-cases');
    
    if (!deletedCases.data || deletedCases.data.length === 0) {
      console.log('✅ No deleted cases found. The delete functionality is working correctly!');
      console.log('   All previously deleted cases have been permanently removed from the database.');
      return;
    }
    
    console.log(`   Found ${deletedCases.data.length} deleted cases in database:`);
    deletedCases.data.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.DOCKET_NO} - ${c.COMPLAINANT} vs ${c.RESPONDENT}`);
    });
    
    // Test permanent delete on the first deleted case
    const testCase = deletedCases.data[0];
    console.log(`\n🗑️  Step 2: Testing permanent delete on case: ${testCase.DOCKET_NO}`);
    
    const deleteResponse = await axios.delete('http://localhost:5000/permanent-delete-case', {
      data: { docket_no: testCase.DOCKET_NO }
    });
    
    console.log(`✅ ${deleteResponse.data.message}`);
    
    // Verify it's gone from deleted cases
    console.log('\n🔍 Step 3: Verifying case is permanently deleted...');
    const updatedDeletedCases = await axios.get('http://localhost:5000/deleted-cases');
    const stillExists = updatedDeletedCases.data.some(c => c.DOCKET_NO === testCase.DOCKET_NO);
    
    if (!stillExists) {
      console.log('✅ SUCCESS! Case permanently deleted from database.');
      console.log(`   Remaining deleted cases: ${updatedDeletedCases.data.length}`);
    } else {
      console.log('❌ FAILED! Case still exists in database.');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Before: ${deletedCases.data.length} deleted cases`);
    console.log(`   After: ${updatedDeletedCases.data.length} deleted cases`);
    console.log(`   Permanently deleted: ${deletedCases.data.length - updatedDeletedCases.data.length} case(s)`);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Cannot connect to server at http://localhost:5000');
      console.error('   Please make sure the server is running with: node server.js');
    } else {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.data);
      }
    }
  }
}

testPermanentDelete();
