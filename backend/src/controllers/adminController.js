const db = require('../config/database');
const reportService = require('../services/reportService');
const notificationService = require('../services/notificationService');

/**
 * Admin Dashboard statistics
 */
async function getDashboard(req, res, next) {
  try {
    const summary = await reportService.getDashboardSummary();
    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all customers with search and pagination
 */
async function getCustomers(req, res, next) {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = `WHERE u.role = 'CUSTOMER'`;
    const params = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      whereClause += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR c.customer_reference ILIKE $${params.length} OR c.account_number ILIKE $${params.length})`;
    }

    const countQuery = `
      SELECT COUNT(*) FROM users u
      JOIN customers c ON c.user_id = u.id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT u.id AS user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
             c.id AS customer_id, c.customer_reference, c.account_number, c.address,
             COUNT(sr.id) AS total_requests
      FROM users u
      JOIN customers c ON c.user_id = u.id
      LEFT JOIN service_requests sr ON sr.customer_id = c.id
      ${whereClause}
      GROUP BY u.id, c.id
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      customers: result.rows,
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
 * Admin request queue with rich filters
 */
async function getAdminRequests(req, res, next) {
  try {
    const { status, serviceId, search, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (status) {
      params.push(status);
      whereClauses.push(`sr.status = $${params.length}`);
    }

    if (serviceId) {
      params.push(serviceId);
      whereClauses.push(`sr.service_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(sr.request_number ILIKE $${params.length} OR sr.subject ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR c.customer_reference ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)
      FROM service_requests sr
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      ${whereSql}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT sr.*, s.name AS service_name, s.service_code,
             u.full_name AS customer_name, u.email AS customer_email,
             c.customer_reference, c.account_number,
             COUNT(rd.id) AS document_count,
             COUNT(rd.id) FILTER (WHERE rd.ai_validation_status = 'Completed') AS ai_validated_count
      FROM service_requests sr
      JOIN services s ON s.id = sr.service_id
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN request_documents rd ON rd.request_id = sr.id
      ${whereSql}
      GROUP BY sr.id, s.name, s.service_code, u.full_name, u.email, c.customer_reference, c.account_number
      ORDER BY 
        CASE 
          WHEN sr.status = 'Pending Admin Review' THEN 1
          WHEN sr.status = 'AI Validation' THEN 2
          WHEN sr.status = 'Document Review' THEN 3
          WHEN sr.status = 'Submitted' THEN 4
          ELSE 5
        END,
        sr.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit, 10), offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows,
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
 * Detailed request review for admins with AI results and full documents
 */
async function getAdminRequestDetails(req, res, next) {
  try {
    const { requestId } = req.params;

    const reqQuery = `
      SELECT sr.*, s.name AS service_name, s.service_code, s.description AS service_description,
             u.id AS customer_user_id, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
             c.customer_reference, c.account_number, c.address AS customer_address, c.date_of_birth,
             admin_u.full_name AS assigned_admin_name
      FROM service_requests sr
      JOIN services s ON s.id = sr.service_id
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = sr.assigned_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      WHERE sr.id = $1
    `;
    const reqRes = await db.query(reqQuery, [requestId]);

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const requestData = reqRes.rows[0];

    // Fetch documents with their latest AI validation output
    const docQuery = `
      SELECT rd.*, dt.name AS document_type_name,
             av.readability_status, av.completeness_status, av.possible_mismatch,
             av.confidence, av.issues, av.summary AS ai_summary, av.recommendation AS ai_recommendation,
             av.uncertainty_note, av.model_id
      FROM request_documents rd
      JOIN document_types dt ON dt.id = rd.document_type_id
      LEFT JOIN LATERAL (
        SELECT * FROM ai_validations
        WHERE request_document_id = rd.id
        ORDER BY created_at DESC
        LIMIT 1
      ) av ON TRUE
      WHERE rd.request_id = $1
      ORDER BY rd.created_at ASC
    `;
    const docRes = await db.query(docQuery, [requestId]);

    // Fetch status history
    const historyQuery = `
      SELECT rsh.*, u.full_name AS changed_by_name, u.role AS changed_by_role
      FROM request_status_history rsh
      JOIN users u ON u.id = rsh.changed_by_user_id
      WHERE rsh.request_id = $1
      ORDER BY rsh.created_at ASC
    `;
    const historyRes = await db.query(historyQuery, [requestId]);

    res.json({
      success: true,
      request: requestData,
      documents: docRes.rows,
      statusHistory: historyRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin Decision Endpoint (Approve / Reject / Correction Required)
 */
async function makeDecision(req, res, next) {
  const client = await db.getClient();
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;
    // decision must be: 'APPROVE', 'REJECT', or 'CORRECTION_REQUIRED'

    if (!['APPROVE', 'REJECT', 'CORRECTION_REQUIRED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be APPROVE, REJECT, or CORRECTION_REQUIRED.',
      });
    }

    if (['REJECT', 'CORRECTION_REQUIRED'].includes(decision) && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A clear reason/remark is mandatory when rejecting or requesting correction.',
      });
    }

    // Fetch current request
    const findReq = await client.query(
      `SELECT sr.*, c.user_id AS customer_user_id, s.name AS service_name
       FROM service_requests sr
       JOIN customers c ON c.id = sr.customer_id
       JOIN services s ON s.id = sr.service_id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (findReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const currentReq = findReq.rows[0];

    let newStatus = '';
    let notificationTitle = '';
    let notificationMsg = '';

    if (decision === 'APPROVE') {
      newStatus = 'Approved';
      notificationTitle = 'Service Request Approved';
      notificationMsg = `Your request (${currentReq.request_number}) for "${currentReq.service_name}" has been approved. Remarks: ${remarks || 'All verifications passed.'}`;
    } else if (decision === 'REJECT') {
      newStatus = 'Rejected';
      notificationTitle = 'Service Request Rejected';
      notificationMsg = `Your request (${currentReq.request_number}) was rejected. Reason: ${remarks}`;
    } else if (decision === 'CORRECTION_REQUIRED') {
      newStatus = 'Correction Required';
      notificationTitle = 'Action Required: Document Correction Needed';
      notificationMsg = `Your request (${currentReq.request_number}) requires your action. Correction note: ${remarks}`;
    }

    await client.query('BEGIN');

    // Update request status & assign to current admin
    await client.query(
      `UPDATE service_requests 
       SET status = $1, assigned_admin_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, req.user.admin_id || null, requestId]
    );

    // Record in request_status_history
    await client.query(
      `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks)
       VALUES ($1, $2, $3, $4, $5)`,
      [requestId, currentReq.status, newStatus, req.user.id, remarks || `Admin decision: ${newStatus}`]
    );

    // Create Customer Notification
    await notificationService.createNotification({
      userId: currentReq.customer_user_id,
      requestId: currentReq.id,
      title: notificationTitle,
      message: notificationMsg,
    });

    // Record Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, 'service_requests', $3, $4, $5)`,
      [
        req.user.id,
        `ADMIN_${decision}`,
        String(requestId),
        JSON.stringify({
          from_status: currentReq.status,
          to_status: newStatus,
          remarks: remarks || '',
          admin: req.user.full_name,
        }),
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Request status successfully updated to '${newStatus}'.`,
      status: newStatus,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  getDashboard,
  getCustomers,
  getAdminRequests,
  getAdminRequestDetails,
  makeDecision,
};
