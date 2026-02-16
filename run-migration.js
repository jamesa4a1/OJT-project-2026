const mysql = require("mysql");
const fs = require("fs");
const path = require("path");

// Database configuration (adjust if your settings are different)
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "ocp_docketing"
};

console.log("🔄 Starting database migration...");
console.log("📊 Adding deleted_by columns to clearances table...");

// Create database connection
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("⚠️  Please make sure MySQL/XAMPP is running and the database exists.");
    process.exit(1);
  }
  
  console.log("✅ Connected to MySQL database");
  
  // Run migration queries
  const migrations = [
    {
      name: "Add deleted_by_user_id column",
      query: "ALTER TABLE clearances ADD COLUMN IF NOT EXISTS deleted_by_user_id INT NULL COMMENT 'User ID who deleted this record'"
    },
    {
      name: "Add deleted_by_name column", 
      query: "ALTER TABLE clearances ADD COLUMN IF NOT EXISTS deleted_by_name VARCHAR(255) NULL COMMENT 'Name of user who deleted this record'"
    },
    {
      name: "Add index for deleted_by_user_id",
      query: "ALTER TABLE clearances ADD INDEX IF NOT EXISTS idx_deleted_by (deleted_by_user_id)"
    }
  ];
  
  // Run migrations sequentially
  let currentIndex = 0;
  
  function runNextMigration() {
    if (currentIndex >= migrations.length) {
      console.log("✅ All migrations completed successfully!");
      console.log("🎉 Clearance deletion will now properly track who deleted records");
      db.end();
      return;
    }
    
    const migration = migrations[currentIndex];
    console.log(`🔄 Running: ${migration.name}...`);
    
    db.query(migration.query, (err, result) => {
      if (err) {
        console.error(`❌ Failed to run migration: ${migration.name}`);
        console.error("Error:", err.message);
        db.end();
        process.exit(1);
      }
      
      console.log(`✅ Completed: ${migration.name}`);
      currentIndex++;
      runNextMigration();
    });
  }
  
  runNextMigration();
});