// Simple test to check middleware imports
try {
  console.log('Testing middleware imports...');
  
  const { authMiddleware } = require('./middleware/authMiddleware');
  console.log('✅ authMiddleware imported:', typeof authMiddleware);
  
  const { adminOnly, staffOrAdmin } = require('./middleware/rbac');
  console.log('✅ adminOnly imported:', typeof adminOnly);
  console.log('✅ staffOrAdmin imported:', typeof staffOrAdmin);
  
  const { sanitizeInput } = require('./middleware/sanitize');
  console.log('✅ sanitizeInput imported:', typeof sanitizeInput);
  
  console.log('\n🧪 Testing middleware execution...');
  
  // Create mock request/response/next
  const mockReq = { headers: {} };
  const mockRes = { 
    status: (code) => ({ json: (data) => console.log(`Response: ${code} - ${JSON.stringify(data)}`) })
  };
  const mockNext = () => console.log('✅ Next() called - middleware passed');
  
  console.log('Testing authMiddleware without token...');
  authMiddleware(mockReq, mockRes, mockNext);
  
} catch (error) {
  console.error('❌ Import/execution error:', error.message);
  console.error('Stack:', error.stack);
}