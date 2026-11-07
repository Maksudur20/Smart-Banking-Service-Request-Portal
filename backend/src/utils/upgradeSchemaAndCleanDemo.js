const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runUpgradeAndClean() {
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('--- Step 1: Upgrading Customers Table Schema ---');
    await client.query(`
      ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS permanent_address TEXT,
        ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT 'Salaried',
        ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(14, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS source_of_funds VARCHAR(150) DEFAULT 'Salary',
        ADD COLUMN IF NOT EXISTS account_type VARCHAR(100) DEFAULT 'Prime Savings Account',
        ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'Pending',
        ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS kyc_reviewed_by_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS account_operational_status VARCHAR(50) DEFAULT 'Restricted',
        ADD COLUMN IF NOT EXISTS balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS nominee_nid VARCHAR(50);
    `);
    console.log('Customers table columns updated.');

    console.log('--- Step 2: Creating kyc_documents Table ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_documents (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        doc_type VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        file_url TEXT NOT NULL,
        cloudinary_public_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255),
        mime_type VARCHAR(100),
        file_size_bytes BIGINT,
        verification_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        admin_remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kyc_docs_customer ON kyc_documents(customer_id);
      CREATE INDEX IF NOT EXISTS idx_kyc_docs_type ON kyc_documents(doc_type);
    `);
    console.log('kyc_documents table ready.');

    console.log('--- Step 3: Creating deposits Table ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        deposit_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        account_number VARCHAR(30) NOT NULL,
        amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
        sender_name VARCHAR(150) NOT NULL,
        sender_mobile VARCHAR(30) NOT NULL,
        deposit_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100),
        deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
        slip_url TEXT NOT NULL,
        slip_public_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending Verification',
        admin_remarks TEXT,
        verified_by_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_deposits_customer ON deposits(customer_id);
      CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
      CREATE INDEX IF NOT EXISTS idx_deposits_trx_id ON deposits(transaction_id);
    `);
    console.log('deposits table ready.');

    console.log('--- Step 4: Creating real_transactions Table ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS real_transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(60) NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        account_number VARCHAR(30) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Deposit', 'Transfer_In', 'Transfer_Out', 'Fee')),
        amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
        counterparty_account VARCHAR(30),
        counterparty_name VARCHAR(150),
        reference VARCHAR(200),
        balance_after NUMERIC(14, 2) NOT NULL,
        deposit_id INTEGER REFERENCES deposits(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_real_tx_customer ON real_transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_real_tx_account ON real_transactions(account_number);
      CREATE INDEX IF NOT EXISTS idx_real_tx_created ON real_transactions(created_at DESC);
    `);
    console.log('real_transactions table ready.');

    console.log('--- Step 5: Removing All Demo Data ---');
    // Delete demo transactions
    await client.query('DELETE FROM demo_transactions');
    console.log('Cleared demo_transactions.');

    // Delete demo complaints & complaint history
    await client.query('DELETE FROM complaint_history');
    await client.query('DELETE FROM complaints');
    console.log('Cleared complaints.');

    // Delete demo AI validations & request documents
    await client.query('DELETE FROM ai_validations');
    await client.query('DELETE FROM request_status_history');
    await client.query('DELETE FROM request_documents');
    await client.query('DELETE FROM service_requests');
    console.log('Cleared demo requests & documents.');

    // Delete notifications
    await client.query('DELETE FROM notifications');
    console.log('Cleared notifications.');

    // Delete demo customers and customers' user accounts (keeping only admins)
    await client.query("DELETE FROM customers");
    await client.query("DELETE FROM users WHERE role = 'CUSTOMER'");
    console.log('Cleared all dummy customer users.');

    // Ensure 1 Super Admin exists with official credentials
    const adminEmail = 'admin@smartbank.com';
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const hash = '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K'; // Password123!
      const userRes = await client.query(`
        INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
        VALUES ('Bank Operations Administrator', $1, '+8801700000001', $2, 'ADMIN', TRUE)
        RETURNING id
      `, [adminEmail, hash]);
      await client.query(`
        INSERT INTO admins (user_id, staff_reference, department)
        VALUES ($1, 'STAFF-ADMIN-01', 'Operations & Risk Oversight')
        ON CONFLICT (user_id) DO NOTHING
      `, [userRes.rows[0].id]);
      console.log('Created Super Admin account.');
    } else {
      console.log('Super Admin account exists and verified.');
    }

    // Check services table - ensure Prime Bank product names
    console.log('--- Step 6: Updating Services Catalogue with Prime Bank-aligned account types ---');
    await client.query(`
      UPDATE services SET name = 'Prime Savings Account Opening', description = 'Standard high-yield savings account with debit card, digital banking and cheque facility.' WHERE service_code = 'ACC_OPEN';
      INSERT INTO services (service_code, name, description, category, processing_time_days, is_active)
      VALUES 
        ('PRIME_CURRENT', 'Prime Current Account Opening', 'Non-interest bearing checking account designed for business transactions, unlimited transfers and free cheque book.', 'Accounts', 2, TRUE),
        ('PRIME_RETAIL', 'Prime Personal Retail Account', 'Tailored transactional checking account for resident Bangladeshi professionals and salaried individuals.', 'Accounts', 2, TRUE),
        ('PRIME_50PLUS', 'Prime 50 & Plus Savings Account', 'Senior citizen priority savings account offering preferential interest rates, healthcare benefits and fee discounts.', 'Accounts', 2, TRUE)
      ON CONFLICT (service_code) DO NOTHING;
    `);
    console.log('Services catalogue updated.');

    console.log('=== All Database Upgrades and Demo Data Cleaning Completed Successfully! ===');
  } catch (err) {
    console.error('Upgrade script failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runUpgradeAndClean();

