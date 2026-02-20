const axios = require('axios');

console.log('🧪 Testing the new separated table structure...\n');

async function testSeparatedTables() {
  try {
    console.log('📋 Step 1: Checking current database state...');
    
    // Get active cases count
    const activeCases = await axios.get('http://localhost:5000/cases');
    console.log(`   Active cases: ${activeCases.data.length}`);
    
    // Get terminated cases count
    const terminatedCases = await axios.get('http://localhost:5000/deleted-cases');
    console.log(`   Terminated cases: ${terminatedCases.data.length}`);
    
    if (activeCases.data.length === 0) {
      console.log('\n⚠️  No active cases found to test termination.');
      console.log('   Please add some cases first to test the functionality.');
      return;
    }
    
    // Test terminating a case
    const testCase = activeCases.data[0];
    console.log(`\n🗑️  Step 2: Testing case termination on: ${testCase.DOCKET_NO}`);
    
    const terminateResponse = await axios.delete('http://localhost:5000/delete-case', {
      data: { docket_no: testCase.DOCKET_NO }
    });
    
    console.log(`✅ ${terminateResponse.data.message}`);
    
    // Verify case moved to terminated table
    console.log('\n🔍 Step 3: Verifying case moved to terminated_cases table...');
    
    const updatedActive = await axios.get('http://localhost:5000/cases');
    const updatedTerminated = await axios.get('http://localhost:5000/deleted-cases');
    
    const stillInActive = updatedActive.data.some(c => c.DOCKET_NO === testCase.DOCKET_NO);
    const nowInTerminated = updatedTerminated.data.some(c => c.DOCKET_NO === testCase.DOCKET_NO);
    
    if (!stillInActive && nowInTerminated) {
      console.log('✅ SUCCESS! Case properly moved to terminated_cases table');
    } else {
      console.log('❌ FAILED! Case movement not working correctly');
      console.log(`   Still in active: ${stillInActive}`);
      console.log(`   Now in terminated: ${nowInTerminated}`);
      return;
    }
    
    // Test restoration
    console.log(`\n↩️  Step 4: Testing case restoration for: ${testCase.DOCKET_NO}`);
    
    const restoreResponse = await axios.patch('http://localhost:5000/restore-case', {
      docket_no: testCase.DOCKET_NO
    });
    
    console.log(`✅ ${restoreResponse.data.message}`);
    
    // Verify case moved back to active table
    console.log('\n🔍 Step 5: Verifying case moved back to cases table...');
    
    const finalActive = await axios.get('http://localhost:5000/cases');
    const finalTerminated = await axios.get('http://localhost:5000/deleted-cases');
    
    const backInActive = finalActive.data.some(c => c.DOCKET_NO === testCase.DOCKET_NO);
    const removedFromTerminated = !finalTerminated.data.some(c => c.DOCKET_NO === testCase.DOCKET_NO);
    
    if (backInActive && removedFromTerminated) {
      console.log('✅ SUCCESS! Case properly restored to cases table');
    } else {
      console.log('❌ FAILED! Case restoration not working correctly');
      console.log(`   Back in active: ${backInActive}`);
      console.log(`   Removed from terminated: ${removedFromTerminated}`);
      return;
    }
    
    console.log('\n📊 Final Summary:');
    console.log(`   Initial active cases: ${activeCases.data.length}`);
    console.log(`   Final active cases: ${finalActive.data.length}`);
    console.log(`   Terminated cases: ${finalTerminated.data.length}`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   ✅ Cases are properly separated into different tables');
    console.log('   ✅ Termination moves cases from cases → terminated_cases');
    console.log('   ✅ Restoration moves cases from terminated_cases → cases');
    console.log('   ✅ No more soft deletes - true table separation achieved!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Cannot connect to server at http://localhost:5000');
      console.error('   Please make sure the server is running with: node server.js');
    } else {
      console.error('❌ Test Error:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.data);
      }
    }
  }
}

testSeparatedTables();