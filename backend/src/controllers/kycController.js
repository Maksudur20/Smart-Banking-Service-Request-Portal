const db = require('../config/database');
const { uploadFileBuffer, deleteDocument } = require('../services/cloudinaryService');

/**
 * Get current customer's KYC details and documents
 */
async function getMyKYC(req, res, next) {
  try {
    const custRes = await db.query(
      `SELECT c.*, u.full_name, u.email, u.phone 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer profile not found.' });
    }

    const customer = custRes.rows[0];

    const docsRes = await db.query(
      `SELECT * FROM kyc_documents WHERE customer_id = $1 ORDER BY created_at ASC`,
      [customer.id]
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        user_id: customer.user_id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        customer_reference: customer.customer_reference,
        account_number: customer.account_number,
        account_type: customer.account_type,
        kyc_status: customer.kyc_status,
        kyc_rejection_reason: customer.kyc_rejection_reason,
        account_operational_status: customer.account_operational_status,
        balance: parseFloat(customer.balance || 0)
      },
      kyc_status: customer.kyc_status,
      documents: docsRes.rows,
      kyc: {
        customer_id: customer.id,
        account_number: customer.account_number,
        account_type: customer.account_type,
        kyc_status: customer.kyc_status,
        kyc_rejection_reason: customer.kyc_rejection_reason,
        account_operational_status: customer.account_operational_status,
        balance: parseFloat(customer.balance || 0),
        documents: docsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Customer re-uploads a specific KYC document
 */
async function reuploadKYCDocument(req, res, next) {
  try {
    const { doc_type, title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Please select a document file to upload.' });
    }

    if (!doc_type) {
      return res.status(400).json({ success: false, message: 'Document type is required.' });
    }

    const custRes = await db.query('SELECT id, account_number FROM customers WHERE user_id = $1', [req.user.id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    const customer = custRes.rows[0];

    // Upload to Cloudinary
    const uploadRes = await uploadFileBuffer(file.buffer, file.originalname, 'Smart-Banking-Service-Request-Portal/kyc');

    // Check if doc already exists for this type
    const existingDoc = await db.query(
      `SELECT id, cloudinary_public_id FROM kyc_documents WHERE customer_id = $1 AND doc_type = $2`,
      [customer.id, doc_type]
    );

    let docRecord;
    if (existingDoc.rows.length > 0) {
      // Update existing
      const updateRes = await db.query(
        `UPDATE kyc_documents
         SET file_url = $1, cloudinary_public_id = $2, file_name = $3,
             mime_type = $4, file_size_bytes = $5, verification_status = 'Pending',
             admin_remarks = NULL, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [uploadRes.secure_url, uploadRes.public_id, file.originalname, file.mimetype, file.size, existingDoc.rows[0].id]
      );
      docRecord = updateRes.rows[0];
    } else {
      // Insert new
      const insertRes = await db.query(
        `INSERT INTO kyc_documents (
           customer_id, doc_type, title, file_url, cloudinary_public_id,
           file_name, mime_type, file_size_bytes, verification_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
         RETURNING *`,
        [customer.id, doc_type, title || doc_type, uploadRes.secure_url, uploadRes.public_id, file.originalname, file.mimetype, file.size]
      );
      docRecord = insertRes.rows[0];
    }

    // Reset customer KYC status to Pending for review
    await db.query(
      `UPDATE customers 
       SET kyc_status = 'Pending', kyc_rejection_reason = NULL, updated_at = NOW() 
       WHERE id = $1`,
      [customer.id]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'KYC_DOCUMENT_REUPLOAD', 'kyc_documents', $2, $3)`,
      [req.user.id, String(docRecord.id), JSON.stringify({ doc_type, file_name: file.originalname })]
    );

    res.json({
      success: true,
      message: 'Document re-uploaded successfully. KYC status reset to Pending Verification.',
      document: docRecord
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: list all KYC applications
 */
async function getAdminKYCApplications(req, res, next) {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT c.id AS customer_id, c.customer_reference, c.account_number, c.account_type,
             c.kyc_status, c.kyc_rejection_reason, c.account_operational_status,
             c.occupation, c.monthly_income, c.created_at,
             u.id AS user_id, u.full_name, u.email, u.phone,
             (SELECT COUNT(*) FROM kyc_documents kd WHERE kd.customer_id = c.id) AS document_count
      FROM customers c
      JOIN users u ON u.id = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND c.kyc_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR c.account_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, applications: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: get single customer KYC application details and uploaded documents
 */
async function getAdminKYCApplicationDetails(req, res, next) {
  try {
    const { customerId } = req.params;

    const custRes = await db.query(
      `SELECT c.*, u.full_name, u.email, u.phone, u.created_at as registered_at,
              a.staff_reference as reviewed_by_staff
       FROM customers c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN admins a ON a.id = c.kyc_reviewed_by_admin_id
       WHERE c.id = $1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer application not found.' });
    }

    const customer = custRes.rows[0];

    const docsRes = await db.query(
      `SELECT * FROM kyc_documents WHERE customer_id = $1 ORDER BY created_at ASC`,
      [customerId]
    );

    res.json({
      success: true,
      customer,
      documents: docsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: decide on KYC application (APPROVE / REJECT / REQUEST_DOCS)
 */
async function reviewKYCApplication(req, res, next) {
  const client = await db.getClient();
  try {
    const { customerId } = req.params;
    const { decision, remarks } = req.body;

    if (!['APPROVE', 'REJECT', 'REQUEST_DOCS'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision. Must be APPROVE, REJECT, or REQUEST_DOCS.' });
    }

    if ((decision === 'REJECT' || decision === 'REQUEST_DOCS') && (!remarks || !remarks.trim())) {
      return res.status(400).json({ success: false, message: 'Remarks / Reason is mandatory when rejecting or requesting additional documents.' });
    }

    await client.query('BEGIN');

    const custRes = await client.query(
      `SELECT c.*, u.id AS user_id, u.full_name, u.email 
       FROM customers c 
       JOIN users u ON u.id = c.user_id 
       WHERE c.id = $1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Customer application not found.' });
    }

    const customer = custRes.rows[0];
    const adminId = req.user.admin_id;

    let newKycStatus = 'Pending';
    let newOpStatus = customer.account_operational_status;
    let notificationTitle = '';
    let notificationMsg = '';

    if (decision === 'APPROVE') {
      newKycStatus = 'Approved';
      newOpStatus = 'Active';
      notificationTitle = 'KYC Verification Approved';
      notificationMsg = `Congratulations ${customer.full_name}! Your KYC verification has been approved by bank administration. Outgoing fund transfers and full digital banking privileges are now activated on your account.`;

      // Update all documents to Verified
      await client.query(
        `UPDATE kyc_documents SET verification_status = 'Verified' WHERE customer_id = $1`,
        [customerId]
      );
    } else if (decision === 'REJECT') {
      newKycStatus = 'Rejected';
      newOpStatus = 'Restricted';
      notificationTitle = 'KYC Verification Rejected';
      notificationMsg = `Dear ${customer.full_name}, your KYC verification was rejected. Reason: "${remarks}". Outgoing fund transfers remain restricted. Please review and re-upload the required documents.`;
    } else if (decision === 'REQUEST_DOCS') {
      newKycStatus = 'Documents Required';
      newOpStatus = 'Restricted';
      notificationTitle = 'Additional KYC Documents Required';
      notificationMsg = `Dear ${customer.full_name}, bank officers require additional/clearer documents for your account. Officer remarks: "${remarks}". Please re-upload documents from your portal.`;
    }

    // Update customer record
    await client.query(
      `UPDATE customers
       SET kyc_status = $1,
           account_operational_status = $2,
           kyc_rejection_reason = $3,
           kyc_reviewed_by_admin_id = $4,
           kyc_reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5`,
      [newKycStatus, newOpStatus, decision === 'APPROVE' ? null : remarks, adminId || null, customerId]
    );

    // Create In-App Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES ($1, $2, $3, 'IN_APP')`,
      [customer.user_id, notificationTitle, notificationMsg]
    );

    // Create Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'KYC_DECISION', 'customers', $2, $3)`,
      [
        req.user.id,
        String(customerId),
        JSON.stringify({ decision, newKycStatus, newOpStatus, remarks: remarks || null })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `KYC application marked as ${newKycStatus} successfully.`,
      new_status: newKycStatus,
      kyc_status: newKycStatus,
      account_operational_status: newOpStatus
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Admin: replace outdated document on behalf of customer
 */
async function adminReplaceKYCDocument(req, res, next) {
  try {
    const { docId } = req.params;
    const { admin_remarks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Please select a replacement file.' });
    }

    const docRes = await db.query('SELECT * FROM kyc_documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KYC Document not found.' });
    }

    const uploadRes = await uploadFileBuffer(file.buffer, file.originalname, 'Smart-Banking-Service-Request-Portal/kyc');

    const updated = await db.query(
      `UPDATE kyc_documents
       SET file_url = $1, cloudinary_public_id = $2, file_name = $3,
           mime_type = $4, file_size_bytes = $5, verification_status = 'Verified',
           admin_remarks = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [uploadRes.secure_url, uploadRes.public_id, file.originalname, file.mimetype, file.size, admin_remarks || 'Replaced by Administrator', docId]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ADMIN_REPLACE_KYC_DOCUMENT', 'kyc_documents', $2, $3)`,
      [req.user.id, String(docId), JSON.stringify({ file_name: file.originalname, remarks: admin_remarks })]
    );

    res.json({
      success: true,
      message: 'Document replaced successfully by Admin.',
      document: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: delete KYC document
 */
async function adminDeleteKYCDocument(req, res, next) {
  try {
    const { docId } = req.params;

    const docRes = await db.query('SELECT * FROM kyc_documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KYC Document not found.' });
    }

    const doc = docRes.rows[0];
    await deleteDocument(doc.cloudinary_public_id);
    await db.query('DELETE FROM kyc_documents WHERE id = $1', [docId]);

    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ADMIN_DELETE_KYC_DOCUMENT', 'kyc_documents', $2, $3)`,
      [req.user.id, String(docId), JSON.stringify({ doc_type: doc.doc_type })]
    );

    res.json({ success: true, message: 'Document removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyKYC,
  reuploadKYCDocument,
  getAdminKYCApplications,
  getAdminKYCApplicationDetails,
  reviewKYCApplication,
  adminReplaceKYCDocument,
  adminDeleteKYCDocument,
};
