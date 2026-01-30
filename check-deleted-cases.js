const mysql = require('mysql2');

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
  
  checkDeletedCases();
});

function checkDeletedCases() {
  const query = "SELECT DOCKET_NO, COMPLAINANT, RESPONDENT, is_deleted, deleted_at FROM cases WHERE is_deleted = 1";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying cases:", err);
      db.end();
      return;
    }
    
    console.log("Currently deleted cases:", results.length);
    results.forEach(row => {
      console.log(`- ${row.DOCKET_NO}: ${row.COMPLAINANT} vs ${row.RESPONDENT}`);
    });
    
    if (results.length === 0) {
      // Create a test case and delete it
      createAndDeleteTestCase();
    } else {
      db.end();
    }
  });
}

function createAndDeleteTestCase() {
  console.log("Creating a new test case to delete...");
  
  const insertQuery = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, is_deleted, deleted_at) 
                       VALUES ('TEST-RESTORE-002', '2024-01-01', 'Test Complainant 2', 'Test Respondent 2', 'Test Offense 2', 1, NOW())`;
  
  db.query(insertQuery, (err, result) => {
    if (err) {
      console.error("Error creating test case:", err);
    } else {
      console.log("✅ Test deleted case created: TEST-RESTORE-002");
    }
    db.end();
  });
}