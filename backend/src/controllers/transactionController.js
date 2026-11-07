const db = require('../config/database');

/**
 * Get demo transactions with filters
 */
async function getTransactions(req, res, next) {
  try {
    const { monitoringStatus, type, limit = 25, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (monitoringStatus) {
      params.push(monitoringStatus);
      whereClauses.push(`dt.monitoring_status = $${params.length}`);
    }

    if (type) {
      params.push(type);
      whereClauses.push(`dt.transaction_type = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM demo_transactions dt ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT dt.*, u.full_name AS customer_name, c.customer_reference
      FROM demo_transactions dt
      LEFT JOIN customers c ON c.id = dt.customer_id
      LEFT JOIN users u ON u.id = c.user_id
      ${whereSql}
      ORDER BY dt.created_at DESC
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
 * Admin updates monitoring status of a transaction
 */
async function updateMonitoringStatus(req, res, next) {
  try {
    const { transactionId } = req.params;
    const { monitoring_status, flag_reason } = req.body;

    if (!['Normal', 'Under_Review', 'Suspicious', 'Cleared'].includes(monitoring_status)) {
      return res.status(400).json({ success: false, message: 'Invalid monitoring status.' });
    }

    const query = `
      UPDATE demo_transactions
      SET monitoring_status = $1, flag_reason = COALESCE($2, flag_reason)
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [monitoring_status, flag_reason || null, transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction record not found.' });
    }

    // Record in audit log
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'TRANSACTION_MONITORING_UPDATE', 'demo_transactions', $2, $3, $4)`,
      [
        req.user.id,
        String(transactionId),
        JSON.stringify({ new_status: monitoring_status, reason: flag_reason }),
        req.ip || '127.0.0.1',
      ]
    );

    res.json({
      success: true,
      message: `Transaction monitoring status updated to '${monitoring_status}'.`,
      transaction: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  updateMonitoringStatus,
};

