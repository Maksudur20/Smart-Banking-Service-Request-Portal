const db = require('../config/database');

/**
 * Get real banking transactions with filters
 */
async function getTransactions(req, res, next) {
  try {
    const { type, search, limit = 25, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (type) {
      params.push(type);
      whereClauses.push(`rt.type = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(rt.transaction_number ILIKE $${params.length} OR rt.account_number ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR rt.counterparty_account ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM real_transactions rt LEFT JOIN customers c ON c.id = rt.customer_id LEFT JOIN users u ON u.id = c.user_id ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT rt.*, u.full_name AS customer_name, u.email AS customer_email, c.customer_reference
      FROM real_transactions rt
      LEFT JOIN customers c ON c.id = rt.customer_id
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
      ORDER BY rt.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      transactions: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get transaction details by ID
 */
async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const query = `
      SELECT rt.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
             c.customer_reference, c.kyc_status, c.account_type
      FROM real_transactions rt
      JOIN customers c ON c.id = rt.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE rt.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction record not found.' });
    }

    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Flag / add compliance note to transaction
 */
async function updateMonitoringStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'TRANSACTION_REVIEW', 'real_transactions', $2, $3)`,
      [req.user.id, String(id), JSON.stringify({ notes: notes || 'Reviewed by admin' })]
    );

    res.json({ success: true, message: 'Compliance note recorded successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  updateMonitoringStatus,
};
