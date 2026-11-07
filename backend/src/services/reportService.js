const db = require('../config/database');

/**
 * Returns high-level dashboard metrics for administrators
 */
async function getDashboardSummary() {
  const [
    usersCount,
    requestsSummary,
    pendingReviews,
    complaintsSummary,
    monitoringStats,
    recentRequests,
  ] = await Promise.all([
    db.query(`SELECT 
      COUNT(*) FILTER (WHERE role = 'CUSTOMER') as customer_count,
      COUNT(*) FILTER (WHERE role = 'ADMIN') as admin_count
      FROM users WHERE is_active = TRUE`),

    db.query(`SELECT 
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'Submitted') as submitted,
      COUNT(*) FILTER (WHERE status = 'Document Review') as doc_review,
      COUNT(*) FILTER (WHERE status = 'AI Validation') as ai_validation,
      COUNT(*) FILTER (WHERE status = 'Pending Admin Review') as pending_admin,
      COUNT(*) FILTER (WHERE status = 'Approved') as approved,
      COUNT(*) FILTER (WHERE status = 'Rejected') as rejected,
      COUNT(*) FILTER (WHERE status = 'Correction Required') as correction_required,
      COUNT(*) FILTER (WHERE status = 'Completed') as completed
      FROM service_requests`),

    db.query(`SELECT COUNT(*) as pending_count FROM service_requests 
      WHERE status IN ('Submitted', 'Document Review', 'AI Validation', 'Pending Admin Review')`),

    db.query(`SELECT 
      COUNT(*) as total_complaints,
      COUNT(*) FILTER (WHERE status = 'Open') as open,
      COUNT(*) FILTER (WHERE status = 'In Review') as in_review,
      COUNT(*) FILTER (WHERE status = 'Resolved') as resolved
      FROM complaints`),

    db.query(`SELECT 
      COUNT(*) as total_transactions,
      COUNT(*) FILTER (WHERE monitoring_status = 'Suspicious') as suspicious_count,
      COUNT(*) FILTER (WHERE monitoring_status = 'Under_Review') as under_review_count
      FROM demo_transactions`),

    db.query(`SELECT sr.id, sr.request_number, sr.subject, sr.status, sr.created_at,
                     s.name AS service_name, u.full_name AS customer_name
              FROM service_requests sr
              JOIN services s ON s.id = sr.service_id
              JOIN customers c ON c.id = sr.customer_id
              JOIN users u ON u.id = c.user_id
              ORDER BY sr.created_at DESC
              LIMIT 6`),
  ]);

  return {
    users: usersCount.rows[0],
    requests: requestsSummary.rows[0],
    pendingCount: parseInt(pendingReviews.rows[0].pending_count, 10),
    complaints: complaintsSummary.rows[0],
    monitoring: monitoringStats.rows[0],
    recentRequests: recentRequests.rows,
  };
}

/**
 * Detailed requests report with filtering
 */
async function getRequestsReport({ startDate, endDate, serviceId, status }) {
  let whereClauses = [];
  let params = [];

  if (startDate) {
    params.push(startDate);
    whereClauses.push(`sr.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    whereClauses.push(`sr.created_at <= $${params.length}`);
  }
  if (serviceId) {
    params.push(serviceId);
    whereClauses.push(`sr.service_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`sr.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT sr.id, sr.request_number, sr.subject, sr.status, sr.created_at, sr.submitted_at,
           s.name AS service_name, s.service_code,
           u.full_name AS customer_name, u.email AS customer_email,
           c.customer_reference, c.account_number,
           COUNT(rd.id) AS document_count
    FROM service_requests sr
    JOIN services s ON s.id = sr.service_id
    JOIN customers c ON c.id = sr.customer_id
    JOIN users u ON u.id = c.user_id
    LEFT JOIN request_documents rd ON rd.request_id = sr.id
    ${whereSql}
    GROUP BY sr.id, s.name, s.service_code, u.full_name, u.email, c.customer_reference, c.account_number
    ORDER BY sr.created_at DESC
  `;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Complaints report
 */
async function getComplaintsReport() {
  const query = `
    SELECT c.id, c.complaint_number, c.category, c.subject, c.status, c.resolution, c.created_at,
           u.full_name AS customer_name, u.email AS customer_email,
           sr.request_number
    FROM complaints c
    JOIN customers cust ON cust.id = c.customer_id
    JOIN users u ON u.id = cust.user_id
    LEFT JOIN service_requests sr ON sr.id = c.request_id
    ORDER BY c.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

module.exports = {
  getDashboardSummary,
  getRequestsReport,
  getComplaintsReport,
};

