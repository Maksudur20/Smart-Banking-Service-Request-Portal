require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/database');

async function run() {
  console.log('--- Setting up DB Schema Updates & Resetting Old Customer Data ---');
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Add nid_number to customers if not exists
    console.log('Adding nid_number column to customers table...');
    await client.query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS nid_number VARCHAR(50);
    `);

    // 2. Create cash_withdrawals table if not exists
    console.log('Creating cash_withdrawals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_withdrawals (
        id SERIAL PRIMARY KEY,
        withdrawal_reference VARCHAR(50) NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        account_number VARCHAR(30) NOT NULL,
        account_holder_name VARCHAR(150) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        cheque_number VARCHAR(50) NOT NULL,
        cheque_date DATE NOT NULL,
        payee_name VARCHAR(150) NOT NULL,
        cheque_image_url TEXT NOT NULL,
        cloudinary_public_id VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        admin_remarks TEXT,
        reviewed_by_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_withdrawals_customer_id ON cash_withdrawals(customer_id);
      CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON cash_withdrawals(status);
    `);

    // 3. Clear all old customer and operational data (fresh project)
    console.log('Cleaning all old customer records for fresh start...');
    await client.query(`DELETE FROM cash_withdrawals;`);
    await client.query(`DELETE FROM real_transactions;`);
    await client.query(`DELETE FROM demo_transactions;`);
    await client.query(`DELETE FROM deposits;`);
    await client.query(`DELETE FROM request_documents;`);
    await client.query(`DELETE FROM request_status_history;`);
    await client.query(`DELETE FROM ai_validations;`);
    await client.query(`DELETE FROM service_requests;`);
    await client.query(`DELETE FROM complaint_history;`);
    await client.query(`DELETE FROM complaints;`);
    await client.query(`DELETE FROM account_closure_documents;`);
    await client.query(`DELETE FROM account_closure_requests;`);
    await client.query(`DELETE FROM kyc_documents;`);
    await client.query(`DELETE FROM notifications;`);
    await client.query(`DELETE FROM audit_logs;`);
    await client.query(`DELETE FROM customers;`);
    await client.query(`DELETE FROM users WHERE role = 'CUSTOMER';`);

    // 4. Ensure unique index on nid_number
    console.log('Creating unique index on customers(nid_number)...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_nid_number 
      ON customers(nid_number) 
      WHERE nid_number IS NOT NULL AND nid_number != '';
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully updated schema and reset all previous customer data!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during schema update and reset:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
