require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function check() {
  const r = await db.query("SELECT id, full_name, email, role, password_hash, is_active FROM users WHERE role='ADMIN'");
  console.log('Admins found:', r.rows.length);
  for (const a of r.rows) {
    console.log(`Admin ${a.id}: email=${a.email}, full_name=${a.full_name}, is_active=${a.is_active}`);
    const passwordsToTest = ['Admin@123456', 'admin123', 'admin', 'password', 'Admin123!', '123456'];
    for (const p of passwordsToTest) {
      const match = await bcrypt.compare(p, a.password_hash);
      if (match) {
        console.log(`>>> MATCH for password: "${p}"`);
      }
    }
  }
  process.exit(0);
}

check();
