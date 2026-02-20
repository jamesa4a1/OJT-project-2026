const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "",
  database: "ocp_docketing"
});

db.connect((err) => {
  if (err) {
    console.log("DB error:", err.message);
    return;
  }
  
  console.log("Connected to database\n");
  
  // Check all clearances
  db.query(
    "SELECT id, or_number, deleted_at, deleted_by_name, deleted_by_user_id FROM clearances ORDER BY id DESC LIMIT 10",
    (err, rows) => {
      if (err) {
        console.log("Query error:", err.message);
      } else {
        console.log("=== All Recent Clearances ===");
        console.log(JSON.stringify(rows, null, 2));
        
        // Count archived
        db.query(
          "SELECT COUNT(*) as archived_count FROM clearances WHERE deleted_at IS NOT NULL",
          (err, countRows) => {
            if (err) {
              console.log("Count error:", err.message);
            } else {
              console.log("\n=== Archived Count ===");
              console.log("Total archived:", countRows[0].archived_count);
            }
            
            // Check table structure
            db.query(
              "SHOW COLUMNS FROM clearances LIKE 'deleted%'",
              (err, cols) => {
                if (err) {
                  console.log("Cols error:", err.message);
                } else {
                  console.log("\n=== Delete Columns ===");
                  console.log(JSON.stringify(cols, null, 2));
                }
                db.end();
              }
            );
          }
        );
      }
    }
  );
});
