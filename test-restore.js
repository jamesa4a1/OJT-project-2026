// Test script to debug restore functionality
const mysql = require('mysql2');

console.log('=== Testing Restore Functionality ===');

// Test database connection and query
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ocp_docketing'
  
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to database");
  
  // Test function to check deleted cases and restore functionality
  testRestoreFunction();
});

// Test function to check deleted cases and restore functionality
function testRestoreFunction() {
  // 1. Check if there are any deleted cases
  const checkDeletedQuery = "SELECT DOCKET_NO, is_deleted, deleted_at FROM cases WHERE is_deleted = 1 LIMIT 5";
  
  db.query(checkDeletedQuery, (err, results) => {
    if (err) {
      console.error("Error querying deleted cases:", err);
      db.end();
      return;
    }
    
    console.log("Deleted cases found:", results.length);
    
    if (results.length > 0) {
      const testDocketNo = results[0].DOCKET_NO;
      console.log("Testing restore for docket:", testDocketNo);
      
      // Test restore query directly
      testRestoreQuery(testDocketNo);
    } else {
      console.log("No deleted cases found to test restore functionality");
      // Create a test deleted case
      createTestDeletedCase();
    }
  });
}

function testRestoreQuery(docketNo) {
  console.log("Testing direct restore query for:", docketNo);
  const restoreQuery = "UPDATE cases SET is_deleted = 0, deleted_at = NULL WHERE DOCKET_NO = ? AND is_deleted = 1";
  
  db.query(restoreQuery, [docketNo], (err, result) => {
    if (err) {
      console.error("Error in restore query:", err);
    } else {
      console.log("Restore query result:", {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      });
      
      if (result.affectedRows === 0) {
        console.log("❌ No matching deleted case found for restoration");
      } else {
        console.log("✅ Case restored successfully");
      }
    }
    
    db.end();
  });
}

function createTestDeletedCase() {
  console.log("Creating a test deleted case...");
  const insertQuery = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, is_deleted, deleted_at) 
                       VALUES ('TEST-DELETE-001', '2024-01-01', 'Test Complainant', 'Test Respondent', 'Test Offense', 1, NOW())`;
  
  db.query(insertQuery, (err, result) => {
    if (err) {
      console.error("Error creating test case:", err);
      db.end();
      return;
    }
    console.log("✅ Test deleted case created with docket: TEST-DELETE-001");
    testRestoreQuery('TEST-DELETE-001');
  });
}