const mysql = require("mysql");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "ocp_docketing"
};

console.log("🔄 Checking and fixing delete columns in cases table...");

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("⚠️  Please make sure MySQL/XAMPP is running.");
    process.exit(1);
  }
  
  console.log("✅ Connected to MySQL database");
  
  // First, check if columns exist
  db.query("DESCRIBE cases", (err, results) => {
    if (err) {
      console.error("❌ Error checking table structure:", err.message);
      db.end();
      process.exit(1);
    }
    
    const columns = results.map(col => col.Field);
    const hasIsDeleted = columns.includes('is_deleted');
    const hasDeletedAt = columns.includes('deleted_at');
    
    console.log("\n📋 Current table columns:", columns.join(", "));
    console.log("\n🔍 Column check:");
    console.log(`   is_deleted: ${hasIsDeleted ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   deleted_at: ${hasDeletedAt ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (hasIsDeleted && hasDeletedAt) {
      console.log("\n✅ All columns exist! No migration needed.");
      
      // Check current delete status
      db.query("SELECT COUNT(*) as total, SUM(is_deleted) as deleted FROM cases", (err, stats) => {
        if (!err && stats[0]) {
          console.log(`\n📊 Current status:`);
          console.log(`   Total cases: ${stats[0].total}`);
          console.log(`   Deleted cases: ${stats[0].deleted || 0}`);
          console.log(`   Active cases: ${stats[0].total - (stats[0].deleted || 0)}`);
        }
        db.end();
      });
      return;
    }
    
    // Run migrations to add missing columns
    console.log("\n🔄 Adding missing columns...");
    
    const migrations = [];
    
    if (!hasIsDeleted) {
      migrations.push({
        name: "Add is_deleted column",
        query: "ALTER TABLE cases ADD COLUMN is_deleted TINYINT DEFAULT 0"
      });
    }
    
    if (!hasDeletedAt) {
      migrations.push({
        name: "Add deleted_at column",
        query: "ALTER TABLE cases ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL"
      });
    }
    
    // Add indexes
    migrations.push({
      name: "Add index on is_deleted",
      query: "ALTER TABLE cases ADD INDEX idx_is_deleted (is_deleted)"
    });
    
    migrations.push({
      name: "Add index on deleted_at",
      query: "ALTER TABLE cases ADD INDEX idx_deleted_at (deleted_at)"
    });
    
    // Run migrations sequentially
    let currentIndex = 0;
    
    function runNextMigration() {
      if (currentIndex >= migrations.length) {
        console.log("\n✅ All migrations completed successfully!");
        console.log("🎉 Delete functionality is now fixed!");
        console.log("\n💡 You can now delete cases from your application.");
        db.end();
        return;
      }
      
      const migration = migrations[currentIndex];
      console.log(`\n⏳ Running: ${migration.name}...`);
      
      db.query(migration.query, (err) => {
        if (err) {
          // Ignore duplicate index errors
          if (err.code === 'ER_DUP_KEYNAME') {
            console.log(`   ⚠️  Index already exists, skipping...`);
          } else {
            console.error(`   ❌ Error: ${err.message}`);
            db.end();
            process.exit(1);
          }
        } else {
          console.log(`   ✅ Success!`);
        }
        
        currentIndex++;
        runNextMigration();
      });
    }
    
    runNextMigration();
  });
});
