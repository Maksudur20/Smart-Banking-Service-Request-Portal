const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL at:');
  console.log(process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'UNDEFINED');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected successfully to database!');

    const schemaPath = path.join(__dirname, '../../sql/schema.sql');
    const seedPath = path.join(__dirname, '../../sql/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');
    await client.query(schemaSql);
    console.log('schema.sql executed successfully.');

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('Executing seed.sql...');
    await client.query(seedSql);
    console.log('seed.sql executed successfully.');

    const res = await client.query('SELECT COUNT(*) FROM services');
    console.log(`Verification: Found ${res.rows[0].count} services in database.`);

    client.release();
    await pool.end();
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();

