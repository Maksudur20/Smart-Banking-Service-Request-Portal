const db = require('../config/database');
const notificationService = require('../services/notificationService');

/**
 * Customer submits a new complaint
 */
async function createComplaint(req, res, next) {
  const client = await db.getClient();
  try {
    const { category, subject, details, request_id } = req.body;
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Customer profile required.' });
    }

    if (!category || !subject || !details) {
      return res.status(400).json({ success: false, message: 'Category, subject, and details are required.' });
    }

    await client.query('BEGIN');

    // Generate complaint number: CMP-YYYY-0000X
    const year = new Date().getFullYear();
    const countRes = await client.query('SELECT COUNT(*) FROM complaints');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const complaintNumber = `CMP-${year}-${String(seq).padStart(5, '0')}`;

    const insertSql = `
      INSERT INTO complaints (complaint_number, customer_id, request_id, category, subject, details, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Open')
      RETURNING *
    `;
    const result = await client.query(insertSql, [
      complaintNumber,
      customerId,
      request_id || null,
      category.trim(),
      subject.trim(),
      details.trim(),
    ]);
    const complaint = result.rows[0];

    // Record initial history
    await client.query(
      `INSERT INTO complaint_history (complaint_id, changed_by_user_id, old_status, new_status, remarks)
       VALUES ($1, $2, NULL, 'Open', 'Complaint submitted by customer.')`,
      [complaint.id, req.user.id]
    );

    // Notify customer
    await notificationService.createNotification({
      userId: req.user.id,
      complaintId: complaint.id,
      title: 'Complaint Registered',
      message: `Your complaint (${complaintNumber}) regarding "${subject}" has been registered. Our support team will review it shortly.`,
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Complaint ${complaintNumber} registered successfully.`,
      complaint,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Get complaints for current customer
 */
async function getCustomerComplaints(req, res, next) {
  try {
    const customerId = req.user.customer_id;
    const query = `
      SELECT c.*, sr.request_number
      FROM complaints c
      LEFT JOIN service_requests sr ON sr.id = c.request_id
      WHERE c.customer_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [customerId]);
    res.json({
      success: true,
      complaints: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin view: all complaints with status filter
 */
async function getAdminComplaints(req, res, next) {
  try {
    const { status } = req.query;
    let whereClause = '';
    const params = [];

    if (status) {
      params.push(status);
      whereClause = `WHERE c.status = $1`;
    }

    const query = `
      SELECT c.*, u.full_name AS customer_name, u.email AS customer_email,
             c_prof.customer_reference, c_prof.account_number,
             sr.request_number,
             admin_u.full_name AS assigned_admin_name
      FROM complaints c
      JOIN customers c_prof ON c_prof.id = c.customer_id
      JOIN users u ON u.id = c_prof.user_id
      LEFT JOIN service_requests sr ON sr.id = c.request_id
      LEFT JOIN admins a ON a.id = c.assigned_admin_id
      LEFT JOIN users admin_u ON admin_u.id = a.user_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.status = 'Open' THEN 1 WHEN c.status = 'In Review' THEN 2 ELSE 3 END,
        c.created_at DESC
    `;
    const result = await db.query(query, params);

    res.json({
      success: true,
      complaints: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin updates complaint status & resolution
 */
async function updateComplaint(req, res, next) {
  const client = await db.getClient();
  try {
    const { complaintId } = req.params;
    const { status, resolution, remarks } = req.body;

    if (!['Open', 'In Review', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint status.' });
    }

    const compRes = await client.query(
      `SELECT c.*, cust.user_id AS customer_user_id
       FROM complaints c
       JOIN customers cust ON cust.id = c.customer_id
       WHERE c.id = $1`,
      [complaintId]
    );

    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    await client.query('BEGIN');

    await client.query(
      `UPDATE complaints
       SET status = $1, resolution = COALESCE($2, resolution), assigned_admin_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, resolution || null, req.user.admin_id || null, complaintId]
    );

    await client.query(
      `INSERT INTO complaint_history (complaint_id, changed_by_user_id, old_status, new_status, remarks)
       VALUES ($1, $2, $3, $4, $5)`,
      [complaintId, req.user.id, complaint.status, status, remarks || resolution || `Status changed to ${status}`]
    );

    // Notify customer
    await notificationService.createNotification({
      userId: complaint.customer_user_id,
      complaintId: complaint.id,
      title: `Complaint Status Updated: ${status}`,
      message: `Your complaint (${complaint.complaint_number}) has been updated to '${status}'. ${resolution ? 'Resolution: ' + resolution : ''}`,
    });

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Complaint updated successfully.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = {
  createComplaint,
  getCustomerComplaints,
  getAdminComplaints,
  updateComplaint,
};
