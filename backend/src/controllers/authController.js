const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { uploadFileBuffer } = require('../services/cloudinaryService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_dev_mode';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new customer / Open a new account with KYC documents
 */
async function register(req, res, next) {
  const client = await db.getClient();
  try {
    const {
      full_name,
      email,
      phone,
      password,
      father_name,
      mother_name,
      date_of_birth,
      nid_number,
      present_address,
      permanent_address,
      occupation = 'Salaried',
      monthly_income = 0,
      source_of_funds = 'Salary',
      account_type = 'Prime Savings Account',
      nominee_name,
      nominee_relation,
      nominee_nid,
      address
    } = req.body;

    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'পূর্ণ নাম, ইমেইল ঠিকানা, মোবাইল নম্বর এবং পাসওয়ার্ড আবশ্যক।',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');

    if (cleanEmail === cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'ইমেইল এবং মোবাইল নম্বর একই হতে পারবে না।',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      });
    }

    await client.query('BEGIN');

    // 1. Strict Check: Email must be unique across all accounts
    const existingEmail = await client.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'এই ইমেইল ঠিকানাটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অন্য একটি ইমেইল ঠিকানা ব্যবহার করুন।',
      });
    }

    // 2. Strict Check: Phone number must be unique across all accounts
    const existingPhone = await client.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    if (existingPhone.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। একই মোবাইল নম্বর দিয়ে অন্য কেউ অ্যাকাউন্ট খুলতে পারবে না।',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user record
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', TRUE)
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name.trim(), cleanEmail, cleanPhone, password_hash]
    );
    const user = userRes.rows[0];

    // Generate unique 10-digit authentic account number: 2026 + 6 random digits
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const accountNumber = `${year}${randomDigits}`;
    const customerRef = `CUST-${year}-${String(user.id).padStart(4, '0')}`;

    // Insert customer profile
    const custRes = await client.query(
      `INSERT INTO customers (
         user_id, customer_reference, account_number, date_of_birth, address,
         father_name, mother_name, permanent_address, occupation, monthly_income,
         source_of_funds, account_type, kyc_status, account_operational_status, balance,
         nominee_name, nominee_relation, nominee_nid
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', 'Restricted', 0.00, $13, $14, $15)
       RETURNING *`,
      [
        user.id,
        customerRef,
        accountNumber,
        date_of_birth || null,
        present_address || address || null,
        father_name || null,
        mother_name || null,
        permanent_address || null,
        occupation || 'Salaried',
        parseFloat(monthly_income) || 0.00,
        source_of_funds || 'Salary',
        account_type || 'Prime Savings Account',
        nominee_name || null,
        nominee_relation || null,
        nominee_nid || null
      ]
    );
    const customer = custRes.rows[0];

    // Handle any uploaded KYC documents (via Multer req.files)
    const uploadedDocs = [];
    if (req.files) {
      const docTypeMapping = {
        applicant_photo: { title: "Applicant Photograph (Used for Profile & Debit Card)" },
        nid_front: { title: "NID Card Front Side (Used for Identity Proof)" },
        nid_back: { title: "NID Card Back Side (Used for Address & Barcode Verification)" },
        signature: { title: "Applicant Signature (Used for Cheque & Transaction Verification)" },
        nominee_photo: { title: "Nominee Photograph (Used for Nominee Verification)" },
        nominee_nid: { title: "Nominee Identity Document (Used for Legal Nominee Verification)" },
        utility_bill: { title: "Utility Bill (Used for Address Verification)" },
        income_proof: { title: "Proof of Income / Salary Slip / Trade License (Used for AML & KYC Eligibility)" }
      };

      for (const [fieldName, meta] of Object.entries(docTypeMapping)) {
        const fileArr = req.files[fieldName];
        if (fileArr && fileArr.length > 0) {
          const f = fileArr[0];
          try {
            const uploadRes = await uploadFileBuffer(f.buffer, f.originalname, 'Smart-Banking-Service-Request-Portal/kyc');
            const docInsert = await client.query(`
              INSERT INTO kyc_documents (
                customer_id, doc_type, title, file_url, cloudinary_public_id,
                file_name, mime_type, file_size_bytes, verification_status
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
              RETURNING *
            `, [
              customer.id,
              fieldName,
              meta.title,
              uploadRes.secure_url,
              uploadRes.public_id,
              f.originalname,
              f.mimetype,
              f.size
            ]);
            uploadedDocs.push(docInsert.rows[0]);
          } catch (uploadErr) {
            console.warn(`[KYC Upload Warning for ${fieldName}]:`, uploadErr.message);
          }
        }
      }
    }

    // Create welcome notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        user.id,
        'Welcome to Smart Banking PLC',
        `Account created successfully! Your Account Number is ${accountNumber}. Your account is currently under Pending KYC verification. You can deposit money into your account, but outgoing fund transfers remain restricted until KYC documents are approved.`
      ]
    );

    // Create audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'ACCOUNT_OPENING_REGISTER', 'users', $2, $3, $4)`,
      [
        user.id,
        String(user.id),
        JSON.stringify({
          email: user.email,
          customer_reference: customerRef,
          account_number: accountNumber,
          account_type: customer.account_type,
          documents_uploaded: uploadedDocs.length
        }),
        req.ip || '127.0.0.1'
      ]
    );

    await client.query('COMMIT');

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully with Pending KYC status.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customer_id: customer.id,
        customer_reference: customer.customer_reference,
        account_number: customer.account_number,
        account_type: customer.account_type,
        balance: 0.00,
        kyc_status: 'Pending',
        account_operational_status: 'Restricted',
        address: customer.address,
        uploaded_documents_count: uploadedDocs.length
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Login user (Customer or Admin)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.password_hash, u.role, u.is_active,
             c.id AS customer_id, c.customer_reference, c.account_number, c.address,
             c.father_name, c.mother_name, c.permanent_address, c.occupation,
             c.monthly_income, c.source_of_funds, c.account_type, c.kyc_status,
             c.kyc_rejection_reason, c.account_operational_status, c.balance,
             c.nominee_name, c.nominee_relation, c.nominee_nid,
             a.id AS admin_id, a.staff_reference, a.department
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN admins a ON a.user_id = u.id
      WHERE u.email = $1
    `;
    const result = await db.query(query, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Record login audit log
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, 'USER_LOGIN', 'users', $2, $3, $4, $5)`,
      [
        user.id,
        String(user.id),
        JSON.stringify({ role: user.role }),
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customer_id: user.customer_id,
        customer_reference: user.customer_reference,
        account_number: user.account_number,
        account_type: user.account_type,
        balance: parseFloat(user.balance || 0),
        kyc_status: user.kyc_status || 'Pending',
        kyc_rejection_reason: user.kyc_rejection_reason,
        account_operational_status: user.account_operational_status || 'Restricted',
        address: user.address,
        occupation: user.occupation,
        monthly_income: user.monthly_income,
        admin_id: user.admin_id,
        staff_reference: user.staff_reference,
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user details
 */
async function getMe(req, res) {
  const u = req.user || {};
  res.json({
    success: true,
    user: {
      ...u,
      customer: {
        id: u.customer_id,
        customer_reference: u.customer_reference,
        account_number: u.account_number,
        account_type: u.account_type,
        balance: parseFloat(u.balance || 0),
        kyc_status: u.kyc_status || 'Pending',
        kyc_rejection_reason: u.kyc_rejection_reason,
        account_operational_status: u.account_operational_status || 'Restricted',
        address: u.address,
        father_name: u.father_name,
        mother_name: u.mother_name,
        occupation: u.occupation,
        monthly_income: u.monthly_income,
      }
    },
  });
}

/**
 * Update authenticated user profile
 */
async function updateProfile(req, res, next) {
  try {
    const { full_name, phone, address } = req.body;
    const userId = req.user.id;

    if (full_name) {
      await db.query('UPDATE users SET full_name = $1 WHERE id = $2', [full_name.trim(), userId]);
    }
    if (phone) {
      await db.query('UPDATE users SET phone = $1 WHERE id = $2', [phone.trim(), userId]);
    }
    if (address && req.user.customer_id) {
      await db.query('UPDATE customers SET address = $1 WHERE id = $2', [address.trim(), req.user.customer_id]);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
};

