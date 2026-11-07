const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_dev_mode';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new customer
 */
async function register(req, res, next) {
  const client = await db.getClient();
  try {
    const { full_name, email, phone, password, address, date_of_birth } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    await client.query('BEGIN');

    // Check if email already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
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
      [full_name.trim(), email.toLowerCase().trim(), phone || null, password_hash]
    );
    const user = userRes.rows[0];

    // Generate unique customer reference & demo account number
    const year = new Date().getFullYear();
    const customerRef = `CUST-${year}-${String(user.id).padStart(4, '0')}`;
    const accountNumber = `${year}${String(user.id).padStart(8, '0')}`;

    // Insert customer profile
    const custRes = await client.query(
      `INSERT INTO customers (user_id, customer_reference, account_number, date_of_birth, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, customer_reference, account_number, address`,
      [user.id, customerRef, accountNumber, date_of_birth || null, address || null]
    );
    const customer = custRes.rows[0];

    // Create welcome notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [
        user.id,
        'Welcome to Smart Banking Portal',
        `Welcome ${user.full_name}! Your customer profile has been created with reference ${customerRef}. You can now submit service requests online.`
      ]
    );

    // Create audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CUSTOMER_REGISTER', 'users', $2, $3, $4)`,
      [
        user.id,
        String(user.id),
        JSON.stringify({ email: user.email, customer_reference: customerRef }),
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
      message: 'Registration successful! Welcome to Smart Banking Portal.',
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
        address: user.address,
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
  res.json({
    success: true,
    user: req.user,
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
