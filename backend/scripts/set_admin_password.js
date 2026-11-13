require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function setPassword() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Admin@123456', salt);
  await db.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@smartbank.com'", [hash]);
  await db.query("UPDATE users SET password_hash = $1 WHERE email = 'verifier@smartbank.com'", [hash]);
  console.log('✅ Admin passwords updated to Admin@123456 successfully!');
  process.exit(0);
}

setPassword();
