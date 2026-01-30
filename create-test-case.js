const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ocp_docketing'
});

// Create a test deleted case directly
const insertQuery = `INSERT INTO cases (DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, OFFENSE, is_deleted, deleted_at) 
                     VALUES ('TEST-RESTORE-003', '2024-01-01', 'Test Complainant 3', 'Test Respondent 3', 'Test Offense 3', 1, NOW())
                     ON DUPLICATE KEY UPDATE is_deleted = 1, deleted_at = NOW()`;

db.query(insertQuery, (err, result) => {
  if (err) {
    console.error("Error creating test case:", err);
  } else {
    console.log("✅ Test deleted case created/updated: TEST-RESTORE-003");
  }
  db.end();
  process.exit(0);
});