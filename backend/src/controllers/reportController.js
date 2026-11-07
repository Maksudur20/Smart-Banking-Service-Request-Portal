const db = require('../config/database');
const reportService = require('../services/reportService');

/**
 * Get request metrics report
 */
async function getRequestsReport(req, res, next) {
  try {
    const { startDate, endDate, serviceId, status } = req.query;
    const reportData = await reportService.getRequestsReport({
      startDate,
      endDate,
      serviceId,
      status,
    });
    res.json({
      success: true,
      data: reportData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Export request metrics report as CSV
 */
async function exportRequestsCSV(req, res, next) {
  try {
    const { startDate, endDate, serviceId, status } = req.query;
    const reportData = await reportService.getRequestsReport({
      startDate,
      endDate,
      serviceId,
      status,
    });

    const headers = [
      'Request Number',
      'Customer Name',
      'Email',
      'Account Number',
      'Service Name',
      'Status',
      'Document Count',
      'Created At',
    ];

    const rows = reportData.map((r) => [
      `"${r.request_number}"`,
      `"${r.customer_name}"`,
      `"${r.customer_email}"`,
      `"${r.account_number || 'N/A'}"`,
      `"${r.service_name}"`,
      `"${r.status}"`,
      r.document_count,
      `"${new Date(r.created_at).toISOString().split('T')[0]}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="banking_requests_report.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

/**
 * Get system audit logs
 */
async function getAuditLogs(req, res, next) {
  try {
    const { action, limit = 30, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = '';
    const params = [];

    if (action) {
      params.push(action);
      whereClause = `WHERE al.action = $1`;
    }

    const countRes = await db.query(`SELECT COUNT(*) FROM audit_logs al ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT al.*, u.full_name AS actor_name, u.email AS actor_email, u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      logs: result.rows,
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

module.exports = {
  getRequestsReport,
  exportRequestsCSV,
  getAuditLogs,
};
