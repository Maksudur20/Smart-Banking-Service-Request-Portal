const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_banking_portal_2026_dev_mode';

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please log in.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details from database to ensure user is active and exists
    const userQuery = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active,
             c.id AS customer_id, c.customer_reference, c.account_number,
             a.id AS admin_id, a.staff_reference, a.department
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN admins a ON a.user_id = u.id
      WHERE u.id = $1
    `;
    const result = await db.query(userQuery, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact bank administration.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or corrupted authentication token.',
    });
  }
}

module.exports = {
  authenticateToken,
};

