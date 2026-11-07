const db = require('../config/database');
const cloudinaryService = require('../services/cloudinaryService');
const aiValidationService = require('../services/aiValidationService');
const notificationService = require('../services/notificationService');

/**
 * Upload a document for a service request
 */
async function uploadDocument(req, res, next) {
  const client = await db.getClient();
  try {
    const { requestId } = req.params;
    const { document_type_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file to upload.' });
    }

    if (!document_type_id) {
      return res.status(400).json({ success: false, message: 'Document type ID is required.' });
    }

    // 1. Verify request existence and customer ownership
    const reqRes = await client.query(
      `SELECT sr.*, s.name as service_name, u.full_name as customer_name
       FROM service_requests sr
       JOIN services s ON s.id = sr.service_id
       JOIN customers c ON c.id = sr.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const requestData = reqRes.rows[0];

    // Customer can only upload to their own request
    if (req.user.role === 'CUSTOMER' && requestData.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied to this request.' });
    }

    // Cannot upload to final state
    if (['Approved', 'Completed', 'Cancelled'].includes(requestData.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload documents to a request in '${requestData.status}' status.`,
      });
    }

    // 2. Verify document type exists
    const docTypeRes = await client.query('SELECT * FROM document_types WHERE id = $1', [document_type_id]);
    if (docTypeRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid document type.' });
    }
    const docType = docTypeRes.rows[0];

    // 3. Upload file buffer to Cloudinary inside the designated folder
    const uploadResult = await cloudinaryService.uploadFileBuffer(
      file.buffer,
      file.originalname,
      process.env.CLOUDINARY_FOLDER || 'Smart-Banking-Service-Request-Portal'
    );

    await client.query('BEGIN');

    // 4. Save metadata into request_documents
    const docInsertSql = `
      INSERT INTO request_documents (
        request_id, document_type_id, cloudinary_public_id, cloudinary_resource_type,
        delivery_type, secure_url, original_file_name, mime_type, file_size_bytes,
        verification_status, ai_validation_status, uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, 'upload', $5, $6, $7, $8, 'Uploaded', 'Processing', $9)
      RETURNING *
    `;

    const docInsertRes = await client.query(docInsertSql, [
      requestId,
      document_type_id,
      uploadResult.public_id,
      uploadResult.resource_type || 'image',
      uploadResult.secure_url,
      file.originalname,
      file.mimetype,
      file.size,
      req.user.id,
    ]);

    const newDoc = docInsertRes.rows[0];

    // 5. Update request status to 'AI Validation' if currently 'Submitted' or 'Document Review'
    if (['Submitted', 'Draft', 'Correction Required'].includes(requestData.status)) {
      await client.query(
        `UPDATE service_requests SET status = 'AI Validation', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [requestId]
      );

      await client.query(
        `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks)
         VALUES ($1, $2, 'AI Validation', $3, $4)`,
        [requestId, requestData.status, req.user.id, `Uploaded ${docType.name}. AI verification initiated.`]
      );
    }

    await client.query('COMMIT');

    // 6. Perform AI-assisted validation asynchronously or immediately
    processAIValidation(newDoc.id, docType.name, uploadResult.secure_url, file.mimetype, file.originalname, {
      customerName: requestData.customer_name,
      serviceName: requestData.service_name,
      requestId: requestData.id,
      userId: req.user.id,
    }).catch((e) => console.error('Background AI validation failed:', e));

    res.status(201).json({
      success: true,
      message: `${docType.name} uploaded successfully and queued for AI validation.`,
      document: {
        id: newDoc.id,
        document_type_id: newDoc.document_type_id,
        document_type_name: docType.name,
        original_file_name: newDoc.original_file_name,
        file_size_bytes: newDoc.file_size_bytes,
        verification_status: newDoc.verification_status,
        ai_validation_status: 'Processing',
        created_at: newDoc.created_at,
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
 * Replace a rejected or correction-requested document
 */
async function replaceDocument(req, res, next) {
  const client = await db.getClient();
  try {
    const { documentId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Please attach replacement file.' });
    }

    const docRes = await client.query(
      `SELECT rd.*, sr.customer_id, sr.status as request_status, dt.name as document_type_name
       FROM request_documents rd
       JOIN service_requests sr ON sr.id = rd.request_id
       JOIN document_types dt ON dt.id = rd.document_type_id
       WHERE rd.id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const oldDoc = docRes.rows[0];

    // Customer ownership verification
    if (req.user.role === 'CUSTOMER' && oldDoc.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Upload replacement to Cloudinary
    const uploadResult = await cloudinaryService.uploadFileBuffer(
      file.buffer,
      file.originalname,
      process.env.CLOUDINARY_FOLDER || 'Smart-Banking-Service-Request-Portal'
    );

    await client.query('BEGIN');

    // Mark previous document as Superseded
    await client.query(
      `UPDATE request_documents SET verification_status = 'Superseded', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [documentId]
    );

    // Insert replacement document
    const insertSql = `
      INSERT INTO request_documents (
        request_id, document_type_id, cloudinary_public_id, cloudinary_resource_type,
        delivery_type, secure_url, original_file_name, mime_type, file_size_bytes,
        verification_status, ai_validation_status, uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, 'upload', $5, $6, $7, $8, 'Uploaded', 'Processing', $9)
      RETURNING *
    `;
    const newDocRes = await client.query(insertSql, [
      oldDoc.request_id,
      oldDoc.document_type_id,
      uploadResult.public_id,
      uploadResult.resource_type || 'image',
      uploadResult.secure_url,
      file.originalname,
      file.mimetype,
      file.size,
      req.user.id,
    ]);
    const replacementDoc = newDocRes.rows[0];

    // Transition request status back to 'AI Validation' / 'Pending Admin Review'
    await client.query(
      `UPDATE service_requests SET status = 'AI Validation', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [oldDoc.request_id]
    );

    await client.query(
      `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks)
       VALUES ($1, 'Correction Required', 'AI Validation', $2, 'Customer re-uploaded corrected document.')`,
      [oldDoc.request_id, req.user.id]
    );

    await client.query('COMMIT');

    // Run AI validation
    processAIValidation(replacementDoc.id, oldDoc.document_type_name, uploadResult.secure_url, file.mimetype, file.originalname, {
      requestId: oldDoc.request_id,
      userId: req.user.id,
    }).catch((e) => console.error('Replacement AI validation failed:', e));

    res.status(201).json({
      success: true,
      message: 'Replacement document uploaded successfully.',
      document: replacementDoc,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Access a secure document URL after verifying authorization
 */
async function getSecureDocumentAccess(req, res, next) {
  try {
    const { documentId } = req.params;

    const query = `
      SELECT rd.*, sr.customer_id
      FROM request_documents rd
      JOIN service_requests sr ON sr.id = rd.request_id
      WHERE rd.id = $1
    `;
    const result = await db.query(query, [documentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = result.rows[0];

    // Security check: Only document owner or Admin can access
    if (req.user.role === 'CUSTOMER' && doc.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied to this document.' });
    }

    // Generate secure URL
    const accessUrl = cloudinaryService.getDocumentAccessUrl(doc.cloudinary_public_id, doc.cloudinary_resource_type);

    res.json({
      success: true,
      url: accessUrl || doc.secure_url,
      document: {
        id: doc.id,
        original_file_name: doc.original_file_name,
        mime_type: doc.mime_type,
        file_size_bytes: doc.file_size_bytes,
        verification_status: doc.verification_status,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Internal helper to run AI validation and save results
 */
async function processAIValidation(documentId, documentTypeName, secureUrl, mimeType, originalName, context) {
  try {
    const aiResult = await aiValidationService.validateDocumentWithAI({
      documentTypeName,
      fileUrl: secureUrl,
      mimeType,
      originalName,
      customerContext: context,
    });

    // Insert into ai_validations
    await db.query(
      `INSERT INTO ai_validations (
        request_document_id, model_id, readability_status, completeness_status,
        possible_mismatch, confidence, issues, summary, recommendation, uncertainty_note,
        validation_status, error_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        documentId,
        aiResult.model_id,
        aiResult.readability_status,
        aiResult.completeness_status,
        aiResult.possible_mismatch,
        aiResult.confidence,
        JSON.stringify(aiResult.issues),
        aiResult.summary,
        aiResult.recommendation,
        aiResult.uncertainty_note,
        aiResult.validation_status,
        aiResult.error_code,
      ]
    );

    // Update document record
    await db.query(
      `UPDATE request_documents 
       SET ai_validation_status = 'Completed', verification_status = 'AI_Reviewed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [documentId]
    );

    // Update request status to 'Pending Admin Review'
    if (context.requestId) {
      await db.query(
        `UPDATE service_requests SET status = 'Pending Admin Review', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [context.requestId]
      );

      // Create in-app notification for customer
      await notificationService.createNotification({
        userId: context.userId,
        requestId: context.requestId,
        title: 'Document AI Scan Complete',
        message: `Your uploaded document (${originalName}) has passed initial automated validation and is queued for officer review.`,
      });
    }
  } catch (err) {
    console.error('Failed to process AI validation for doc ' + documentId, err);
    await db.query(
      `UPDATE request_documents SET ai_validation_status = 'Failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [documentId]
    );
  }
}

module.exports = {
  uploadDocument,
  replaceDocument,
  getSecureDocumentAccess,
  processAIValidation,
};
