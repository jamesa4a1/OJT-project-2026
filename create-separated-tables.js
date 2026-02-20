const mysql = require("mysql");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "ocp_docketing"
};

console.log("🗄️  Creating terminated_cases table...");

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  
  console.log("✅ Connected to MySQL database");
  
  const migrations = [
    {
      name: "Create terminated_cases table",
      sql: `CREATE TABLE IF NOT EXISTS terminated_cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        DOCKET_NO VARCHAR(255) NOT NULL UNIQUE,
        DATE_FILED DATE,
        COMPLAINANT VARCHAR(255),
        RESPONDENT VARCHAR(255),
        ADDRESS_OF_RESPONDENT TEXT,
        OFFENSE VARCHAR(255),
        DATE_OF_COMMISSION DATE,
        DATE_RESOLVED DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        RESOLVING_PROSECUTOR VARCHAR(255),
        CRIM_CASE_NO VARCHAR(255),
        BRANCH VARCHAR(255),
        DATEFILED_IN_COURT VARCHAR(255),
        REMARKS_DECISION TEXT,
        PENALTY TEXT,
        INDEX_CARDS VARCHAR(255),
        terminated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        terminated_by_user_id INT,
        terminated_by_name VARCHAR(255),
        termination_reason VARCHAR(255) DEFAULT 'Case Terminated',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        INDEX idx_docket_no (DOCKET_NO),
        INDEX idx_terminated_at (terminated_at),
        INDEX idx_terminated_by (terminated_by_user_id),
        INDEX idx_status (status)
      )`
    },
    {
      name: "Create case_movements audit table",
      sql: `CREATE TABLE IF NOT EXISTS case_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        docket_no VARCHAR(255) NOT NULL,
        movement_type ENUM('TERMINATED', 'RESTORED', 'PERMANENTLY_DELETED') NOT NULL,
        moved_from_table VARCHAR(50),
        moved_to_table VARCHAR(50),
        moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        moved_by_user_id INT,
        moved_by_name VARCHAR(255),
        reason VARCHAR(255),
        INDEX idx_docket_movement (docket_no),
        INDEX idx_movement_type (movement_type),
        INDEX idx_moved_at (moved_at)
      )`
    }
  ];
  
  let currentIndex = 0;
  
  function runNextMigration() {
    if (currentIndex >= migrations.length) {
      // Now migrate existing soft-deleted cases
      console.log("\n📦 Migrating existing soft-deleted cases...");
      
      // First, check if there are any soft-deleted cases
      db.query("SELECT COUNT(*) as count FROM cases WHERE is_deleted = 1", (err, results) => {
        if (err) {
          console.error("❌ Error checking soft-deleted cases:", err);
          db.end();
          return;
        }
        
        const softDeletedCount = results[0].count;
        console.log(`   Found ${softDeletedCount} soft-deleted cases to migrate`);
        
        if (softDeletedCount > 0) {
          // Move soft-deleted cases to terminated_cases table
          const migrationSQL = `
            INSERT IGNORE INTO terminated_cases (
              DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT, 
              OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
              CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
              INDEX_CARDS, terminated_at, created_at, created_by, updated_at, updated_by
            )
            SELECT 
              DOCKET_NO, DATE_FILED, COMPLAINANT, RESPONDENT, ADDRESS_OF_RESPONDENT,
              OFFENSE, DATE_OF_COMMISSION, DATE_RESOLVED, status, RESOLVING_PROSECUTOR,
              CRIM_CASE_NO, BRANCH, DATEFILED_IN_COURT, REMARKS_DECISION, PENALTY,
              INDEX_CARDS, 
              COALESCE(deleted_at, updated_at) as terminated_at,
              created_at, created_by, updated_at, updated_by
            FROM cases 
            WHERE is_deleted = 1
          `;
          
          db.query(migrationSQL, (err, result) => {
            if (err) {
              console.error("❌ Error migrating cases:", err);
              db.end();
              return;
            }
            
            console.log(`   ✅ Migrated ${result.affectedRows} cases to terminated_cases table`);
            
            // Log the movements
            const logSQL = `
              INSERT INTO case_movements (docket_no, movement_type, moved_from_table, moved_to_table, reason)
              SELECT DOCKET_NO, 'TERMINATED', 'cases', 'terminated_cases', 'Migration from soft delete'
              FROM cases 
              WHERE is_deleted = 1
            `;
            
            db.query(logSQL, (err) => {
              if (err) console.warn("⚠️  Warning: Could not log movements:", err.message);
              
              // Remove migrated cases from cases table
              db.query("DELETE FROM cases WHERE is_deleted = 1", (err, deleteResult) => {
                if (err) {
                  console.error("❌ Error removing migrated cases:", err);
                  db.end();
                  return;
                }
                
                console.log(`   🗑️  Removed ${deleteResult.affectedRows} cases from original table`);
                
                // Show final stats
                showFinalStats();
              });
            });
          });
        } else {
          showFinalStats();
        }
      });
      return;
    }
    
    const migration = migrations[currentIndex];
    console.log(`\n⏳ ${migration.name}...`);
    
    db.query(migration.sql, (err, result) => {
      if (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`   ⚠️  Table already exists, skipping...`);
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
  
  function showFinalStats() {
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
  }
  
  runNextMigration();
});