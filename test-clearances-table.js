const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ocp_docketing'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  
  console.log('✅ Connected to database');
  
  // Check if clearances table exists
  db.query('SHOW TABLES LIKE "clearances"', (err, results) => {
    if (err) {
      console.error('❌ Error checking table:', err);
      db.end();
      return;
    }
    
    if (results.length === 0) {
      console.error('❌ Table "clearances" does not exist!');
      console.log('Please run the migration: database/migration_add_clearances.sql');
      db.end();
      return;
    }
    
    console.log('✅ Table "clearances" exists');
    
    // Check table structure
    db.query('DESCRIBE clearances', (err, columns) => {
      if (err) {
        console.error('❌ Error describing table:', err);
        db.end();
        return;
      }
      
      console.log('\n📋 Table Structure:');
      const deletedAtColumn = columns.find(col => col.Field === 'deleted_at');
      const deletedByUserIdColumn = columns.find(col => col.Field === 'deleted_by_user_id');
      const deletedByNameColumn = columns.find(col => col.Field === 'deleted_by_name');
      
      if (!deletedAtColumn) {
        console.error('❌ Column "deleted_at" is missing!');
      } else {
        console.log('✅ deleted_at:', deletedAtColumn.Type, deletedAtColumn.Null, deletedAtColumn.Default);
      }
      
      if (!deletedByUserIdColumn) {
        console.error('❌ Column "deleted_by_user_id" is missing!');
      } else {
        console.log('✅ deleted_by_user_id:', deletedByUserIdColumn.Type, deletedByUserIdColumn.Null);
      }
      
      if (!deletedByNameColumn) {
        console.error('❌ Column "deleted_by_name" is missing!');
      } else {
        console.log('✅ deleted_by_name:', deletedByNameColumn.Type, deletedByNameColumn.Null);
      }
      
      // Check for any archived clearances
      db.query('SELECT COUNT(*) as total FROM clearances WHERE deleted_at IS NOT NULL', (err, results) => {
        if (err) {
          console.error('❌ Error counting archived clearances:', err);
        } else {
          console.log('\n📦 Archived clearances in database:', results[0].total);
        }
        
        // Check for all clearances
        db.query('SELECT COUNT(*) as total FROM clearances', (err, results) => {
          if (err) {
            console.error('❌ Error counting all clearances:', err);
          } else {
            console.log('📊 Total clearances in database:', results[0].total);
          }
          
          // Show sample of clearances with their deleted_at status
          db.query('SELECT id, or_number, deleted_at, deleted_by_name FROM clearances LIMIT 5', (err, results) => {
            if (err) {
              console.error('❌ Error fetching sample clearances:', err);
            } else {
              console.log('\n📋 Sample clearances:');
              results.forEach(row => {
                console.log(`  ID: ${row.id}, OR: ${row.or_number}, Deleted: ${row.deleted_at ? 'YES (' + row.deleted_at + ')' : 'NO'}, By: ${row.deleted_by_name || 'N/A'}`);
              });
            }
            
            db.end();
            console.log('\n✅ Test complete');
          });
        });
      });
    });
  });
});
