const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ocp_docketing'
});

// Check for deleted columns
db.query('SHOW COLUMNS FROM clearances WHERE Field LIKE "deleted%"', (err, results) => {
  if (err) {
    console.error('Error checking columns:', err);
  } else {
    console.log('Deleted columns in clearances table:');
    console.log(JSON.stringify(results, null, 2));
  }
  
  // Also check if there are any deleted clearances
  db.query('SELECT COUNT(*) as count FROM clearances WHERE deleted_at IS NOT NULL', (err2, results2) => {
    if (err2) {
      console.error('Error counting deleted clearances:', err2);
    } else {
      console.log('\nDeleted clearances count:', results2[0].count);
    }
    
    // Show a sample of deleted clearances
    db.query('SELECT id, or_number, first_name, last_name, deleted_at, deleted_by_name FROM clearances WHERE deleted_at IS NOT NULL LIMIT 5', (err3, results3) => {
      if (err3) {
        console.error('Error fetching deleted clearances:', err3);
      } else {
        console.log('\nSample deleted clearances:');
        console.log(JSON.stringify(results3, null, 2));
      }
      db.end();
    });
  });
});
