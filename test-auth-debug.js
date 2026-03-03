const express = require('express');
const { authMiddleware } = require('./middleware/authMiddleware');
const { adminOnly } = require('./middleware/rbac');

const app = express();
app.use(express.json());

// Test endpoint with debugging
app.get('/test-auth', 
  (req, res, next) => {
    console.log('🔍 Before authMiddleware');
    next();
  },
  authMiddleware,
  (req, res, next) => {
    console.log('🔍 After authMiddleware');
    next();
  },
  adminOnly,
  (req, res, next) => {
    console.log('🔍 After adminOnly');
    next();
  },
  (req, res) => {
    console.log('🔍 In final handler');
    res.json({ success: true, message: 'Auth test passed!' });
  }
);

// Test endpoint without auth
app.get('/test-no-auth', (req, res) => {
  res.json({ success: true, message: 'No auth required' });
});

const port = 5001;
app.listen(port, () => {
  console.log(`🧪 Test server running on port ${port}`);
});

// Test the endpoints
setTimeout(async () => {
  const axios = require('axios');
  
  console.log('\n🔍 Testing protected endpoint...');
  try {
    await axios.get(`http://localhost:${port}/test-auth`);
  } catch (error) {
    console.log(`✅ Protected endpoint blocked: ${error.response?.status} - ${error.response?.data?.message}`);
  }
  
  console.log('\n🔍 Testing unprotected endpoint...');
  try {
    const response = await axios.get(`http://localhost:${port}/test-no-auth`);
    console.log(`✅ Unprotected endpoint works: ${response.status}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  process.exit(0);
}, 1000);