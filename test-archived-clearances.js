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
  
  console.log('✅ Connected to database\n');
  
  // Show ALL clearances including deleted ones
  db.query('SELECT id, or_number, first_name, last_name, deleted_at, deleted_by_name FROM clearances ORDER BY id', (err, results) => {
    if (err) {
      console.error('❌ Error fetching clearances:', err);
      db.end();
      return;
    }
    
    console.log('📋 ALL CLEARANCES:');
    console.log('='.repeat(100));
    results.forEach(row => {
      const status = row.deleted_at ? '🗑️  DELETED' : '✅ ACTIVE';
      const deletedInfo = row.deleted_at ? ` on ${row.deleted_at} by ${row.deleted_by_name}` : '';
      console.log(`${status} | ID: ${row.id} | OR: ${row.or_number} | Name: ${row.first_name} ${row.last_name}${deletedInfo}`);
    });
    console.log('='.repeat(100));
    
    // Show just deleted ones
    db.query('SELECT id, or_number, first_name, last_name, deleted_at, deleted_by_name FROM clearances WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC', (err, results) => {
      if (err) {
        console.error('❌ Error fetching archived clearances:', err);
      } else {
        console.log('\n📦 ARCHIVED CLEARANCES ONLY:');
        console.log('='.repeat(100));
        if (results.length === 0) {
          console.log('  No archived clearances found!');
        } else {
          results.forEach(row => {
            console.log(`  ID: ${row.id} | OR: ${row.or_number} | Name: ${row.first_name} ${row.last_name}`);
            console.log(`  Deleted: ${row.deleted_at} by ${row.deleted_by_name}`);
            console.log('-'.repeat(100));
          });
        }
        console.log('='.repeat(100));
      }
      
      db.end();
      console.log('\n✅ Test complete\n');
    });
  });
});
