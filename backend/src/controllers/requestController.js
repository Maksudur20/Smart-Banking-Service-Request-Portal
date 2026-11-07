const db = require('../config/database');
const notificationService = require('../services/notificationService');

/**
 * Submit a new service request
 */
async function createRequest(req, res, next) {
  const client = await db.getClient();
  try {
    const { service_id, subject, details } = req.body;
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: 'Only registered customers can submit service requests.',
      });
    }

    if (!service_id || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Service category and subject are required.',
      });
    }

    // Verify service exists and is active
    const serviceRes = await client.query('SELECT * FROM services WHERE id = $1 AND is_active = TRUE', [service_id]);
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Selected banking service is not available.',
      });
    }
    const service = serviceRes.rows[0];

    await client.query('BEGIN');

    // Generate formatted request number: SBR-YYYY-0000X
    const year = new Date().getFullYear();
    const countRes = await client.query('SELECT COUNT(*) FROM service_requests');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const requestNumber = `SBR-${year}-${String(seq).padStart(5, '0')}`;

    // Insert request
    const insertQuery = `
      INSERT INTO service_requests (request_number, customer_id, service_id, subject, details, status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, 'Submitted', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const reqRes = await client.query(insertQuery, [
      requestNumber,
      customerId,
      service_id,
      subject.trim(),
      details ? details.trim() : null,
    ]);
    const newRequest = reqRes.rows[0];

    // Record initial status in request_status_history
    await client.query(
      `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks)
       VALUES ($1, NULL, 'Submitted', $2, 'Customer created and submitted request form.')`,
      [newRequest.id, req.user.id]
    );

    // Create in-app notification
    await notificationService.createNotification({
      userId: req.user.id,
      requestId: newRequest.id,
      title: 'Service Request Submitted',
      message: `Your request (${requestNumber}) for "${service.name}" was submitted successfully. Please attach the required documents to expedite review.`,
    });

    // Record audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'REQUEST_SUBMITTED', 'service_requests', $2, $3, $4)`,
      [
        req.user.id,
        String(newRequest.id),
        JSON.stringify({ request_number: requestNumber, service: service.service_code }),
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Request ${requestNumber} created successfully!`,
      request: newRequest,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Get all requests submitted by the current authenticated customer
 */
async function getCustomerRequests(req, res, next) {
  try {
    const customerId = req.user.customer_id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Customer profile required.' });
    }

    const { status, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = `WHERE sr.customer_id = $1`;
    const params = [customerId];

    if (status) {
      params.push(status);
      whereClause += ` AND sr.status = $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*) FROM service_requests sr ${whereClause}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT sr.*, s.name AS service_name, s.service_code, s.category AS service_category,
             COUNT(rd.id) AS document_count
      FROM service_requests sr
      JOIN services s ON s.id = sr.service_id
      LEFT JOIN request_documents rd ON rd.request_id = sr.id
      ${whereClause}
      GROUP BY sr.id, s.name, s.service_code, s.category
      ORDER BY sr.created_at DESC
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
 * Get single request details by ID
 */
async function getRequestById(req, res, next) {
  try {
    const { requestId } = req.params;

    const parsedId = parseInt(requestId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format.' });
    }

    const requestQuery = `
      SELECT sr.*, s.name AS service_name, s.service_code, s.description AS service_description,
             u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
             c.customer_reference, c.account_number, c.address AS customer_address,
             admin_u.full_name AS assigned_admin_name
      FROM service_requests sr
      JOIN services s ON s.id = sr.service_id
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = sr.assigned_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      WHERE sr.id = $1
    `;
    const reqRes = await db.query(requestQuery, [requestId]);

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const requestData = reqRes.rows[0];

    // Check authorization: Customer can only view their own request
    if (req.user.role === 'CUSTOMER' && requestData.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied to this service request.' });
    }

    // Fetch documents
    const docQuery = `
      SELECT rd.*, dt.name AS document_type_name, dt.description AS document_type_description
      FROM request_documents rd
      JOIN document_types dt ON dt.id = rd.document_type_id
      WHERE rd.request_id = $1
      ORDER BY rd.created_at ASC
    `;
    const docRes = await db.query(docQuery, [requestId]);

    // Fetch required documents for this service
    const reqDocQuery = `
      SELECT sdr.*, dt.name AS document_name
      FROM service_document_requirements sdr
      JOIN document_types dt ON dt.id = sdr.document_type_id
      WHERE sdr.service_id = $1
    `;
    const reqDocRes = await db.query(reqDocQuery, [requestData.service_id]);

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
      requirements: reqDocRes.rows,
      statusHistory: historyRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a request (customer initiated)
 */
async function cancelRequest(req, res, next) {
  const client = await db.getClient();
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;

    const findReq = await client.query('SELECT * FROM service_requests WHERE id = $1', [requestId]);
    if (findReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const existingReq = findReq.rows[0];

    // Must be owner
    if (existingReq.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cancellation business rule: only before final decision (Approved/Completed/Rejected)
    if (['Approved', 'Rejected', 'Completed', 'Cancelled'].includes(existingReq.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already in '${existingReq.status}' status.`,
      });
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE service_requests SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [requestId]
    );

    await client.query(
      `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks)
       VALUES ($1, $2, 'Cancelled', $3, $4)`,
      [requestId, existingReq.status, req.user.id, remarks || 'Cancelled by customer']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Service request has been cancelled successfully.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  createRequest,
  getCustomerRequests,
  getRequestById,
  cancelRequest,
};

