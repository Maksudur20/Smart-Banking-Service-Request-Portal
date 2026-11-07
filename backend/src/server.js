const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity
    const testRes = await db.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`[Supabase PostgreSQL] Connected to database "${testRes.rows[0].db_name}" at ${testRes.rows[0].current_time}`);

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Smart Banking Service Request Portal API running`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port: ${PORT}`);
      console.log(` Local URL: http://localhost:${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server due to database connection error:', err.message);
    process.exit(1);
  }
}

startServer();

