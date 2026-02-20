const mysql = require("mysql");
const fs = require("fs");
const path = require("path");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "ocp_docketing"
};

console.log("🗄️  Creating terminated_cases table and migrating data...");

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("⚠️  Please make sure MySQL/XAMPP is running.");
    process.exit(1);
  }
  
  console.log("✅ Connected to MySQL database");
  
  // Read and execute the migration SQL
  const migrationPath = path.join(__dirname, 'database', 'migration_create_terminated_cases.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file not found:", migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split SQL into individual statements (remove empty ones)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
  
  console.log(`\n📋 Found ${statements.length} SQL statements to execute`);
  
  let currentIndex = 0;
  
  function executeNextStatement() {
    if (currentIndex >= statements.length) {
      console.log("\n✅ Migration completed successfully!");
      
      // Show final statistics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM cases) as active_cases,
          (SELECT COUNT(*) FROM terminated_cases) as terminated_cases,
          (SELECT COUNT(*) FROM case_movements) as movement_logs
      `, (err, results) => {
        if (!err && results[0]) {
          console.log("\n📊 Final Database Statistics:");
          console.log(`   Active Cases: ${results[0].active_cases}`);
          console.log(`   Terminated Cases: ${results[0].terminated_cases}`);
          console.log(`   Movement Logs: ${results[0].movement_logs}`);
        }
        
        console.log("\n🎉 Database restructure complete!");
        console.log("   • Cases are now properly separated into two tables");
        console.log("   • Terminated cases have their own dedicated table");
        console.log("   • Full audit trail of case movements is maintained");
        db.end();
      });
      return;
    }
    
    const statement = statements[currentIndex];
    console.log(`\n⏳ Executing statement ${currentIndex + 1}/${statements.length}...`);
    
    // Show first part of statement for context
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
    console.log(`   ${preview}${statement.length > 60 ? '...' : ''}`);
    
    db.query(statement, (err, results) => {
      if (err) {
        // Check if it's a harmless error we can ignore
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
            err.code === 'ER_DUP_KEYNAME' ||
            err.message.includes('already exists')) {
          console.log(`   ⚠️  Skipping: ${err.message}`);
        } else {
          console.error(`   ❌ Error: ${err.message}`);
          db.end();
          process.exit(1);
        }
      } else {
        console.log(`   ✅ Success!`);
        if (results && results.affectedRows !== undefined) {
          console.log(`      Affected rows: ${results.affectedRows}`);
        }
      }
      
      currentIndex++;
      executeNextStatement();
    });
  }
  
  executeNextStatement();
});