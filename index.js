require('dotenv').config(); // This reads the .env file

const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;


// Using the env variable here
const db = new Pool({
  connectionString: process.env.DATABASE_URL="postgresql://postgres:OCP_Tagbilaran12345@db.wxbfuxbaqvwatjjmbpjb.supabase.co:5432/postgres"
,
  ssl: { rejectUnauthorized: false },
});

app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.send(`Supabase connected! DB time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(' DB connection error:', err);
    res.status(500).send(' DB connection error');
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
