const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables!');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};

