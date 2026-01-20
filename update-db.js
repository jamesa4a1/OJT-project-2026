const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "ocp_docketing",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    process.exit(1);
  }
  console.log("Connected to MySQL database.");

  // Update the role ENUM to include Staff
  db.query("ALTER TABLE users MODIFY role ENUM('Admin', 'Clerk', 'Staff') DEFAULT 'Clerk'", (err, results) => {
    if (err) {
      console.error("Error updating users table:", err);
    } else {
      console.log("✅ Successfully updated users table - Staff role added");
    }
    db.end();
    process.exit(0);
  });
});
