const mysql = require("mysql");
const bcrypt = require("bcryptjs");

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

  // Hash password for staff user
  const password = "staff123";
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert a test staff user
  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role='Staff'",
    ["Test Staff", "staff@gmail.com", hashedPassword, "Staff"],
    (err, results) => {
      if (err) {
        console.error("Error inserting staff user:", err);
      } else {
        console.log("✅ Successfully inserted test Staff user (email: staff@gmail.com, password: staff123)");
      }
      db.end();
      process.exit(0);
    }
  );
});
