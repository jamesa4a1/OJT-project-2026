const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hoj_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database.');
  
  // Read the seed.sql file
  const seedFilePath = path.join(__dirname, 'database', 'seed.sql');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error('❌ seed.sql file not found at:', seedFilePath);
    db.end();
    process.exit(1);
  }

  fs.readFile(seedFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading seed.sql:', err.message);
      db.end();
      process.exit(1);
    }

    // Split by semicolon to execute each statement separately
    const statements = data
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let completed = 0;

    const executeStatement = (index) => {
      if (index >= statements.length) {
        console.log('\n✅ Database seeding completed successfully!');
        db.end();
        process.exit(0);
      }

      const statement = statements[index];
      
      db.query(statement, (err, results) => {
        if (err) {
          console.error(`❌ Error executing statement ${index + 1}:`, err.message);
          // Continue with next statement instead of exiting
          executeStatement(index + 1);
        } else {
          completed++;
          console.log(`✓ Statement ${index + 1}/${statements.length} executed`);
          executeStatement(index + 1);
        }
      });
    };

    console.log(`\n🌱 Starting database seed with ${statements.length} statements...\n`);
    executeStatement(0);
  });
});
