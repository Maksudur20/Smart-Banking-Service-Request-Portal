const db = require('../config/database');
const aiValidationService = require('../services/aiValidationService');
const { processAIValidation } = require('./documentController');

/**
 * Trigger or re-run AI validation for a specific document
 */
async function triggerAIValidation(req, res, next) {
  try {
    const { documentId } = req.params;

    const docQuery = `
      SELECT rd.*, dt.name AS document_type_name, sr.customer_id, sr.id AS request_id,
             u.full_name AS customer_name, s.name AS service_name
      FROM request_documents rd
      JOIN document_types dt ON dt.id = rd.document_type_id
      JOIN service_requests sr ON sr.id = rd.request_id
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      JOIN services s ON s.id = sr.service_id
      WHERE rd.id = $1
    `;
    const docRes = await db.query(docQuery, [documentId]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docRes.rows[0];

    // Authorization
    if (req.user.role === 'CUSTOMER' && doc.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Set status to Processing
    await db.query(`UPDATE request_documents SET ai_validation_status = 'Processing' WHERE id = $1`, [documentId]);

    // Process AI
    await processAIValidation(doc.id, doc.document_type_name, doc.secure_url, doc.mime_type, doc.original_file_name, {
      requestId: doc.request_id,
      userId: req.user.id,
      customerName: doc.customer_name,
      serviceName: doc.service_name,
    });

    // Fetch newly recorded validation
    const valRes = await db.query(
      `SELECT * FROM ai_validations WHERE request_document_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [documentId]
    );

    res.json({
      success: true,
      message: 'AI validation completed successfully.',
      validation: valRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get AI validation results for a document
 */
async function getDocumentAIResults(req, res, next) {
  try {
    const { documentId } = req.params;

    const query = `
      SELECT av.*, rd.original_file_name, rd.verification_status, rd.ai_validation_status,
             dt.name AS document_type_name, sr.customer_id
      FROM ai_validations av
      JOIN request_documents rd ON rd.id = av.request_document_id
      JOIN document_types dt ON dt.id = rd.document_type_id
      JOIN service_requests sr ON sr.id = rd.request_id
      WHERE av.request_document_id = $1
      ORDER BY av.created_at DESC
    `;
    const result = await db.query(query, [documentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No AI validation records found for this document.',
      });
    }

    const firstRow = result.rows[0];
    if (req.user.role === 'CUSTOMER' && firstRow.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({
      success: true,
      validations: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get AI-generated summary of the entire request
 */
async function getRequestAISummary(req, res, next) {
  try {
    const { requestId } = req.params;

    // Fetch request details
    const reqRes = await db.query(
      `SELECT sr.*, s.name AS service_name, u.full_name AS customer_name
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

    const requestDetails = reqRes.rows[0];

    // Fetch documents
    const docRes = await db.query(
      `SELECT rd.*, dt.name AS document_type_name
       FROM request_documents rd
       JOIN document_types dt ON dt.id = rd.document_type_id
       WHERE rd.request_id = $1`,
      [requestId]
    );

    const summary = await aiValidationService.generateRequestSummary(requestDetails, docRes.rows);

    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  triggerAIValidation,
  getDocumentAIResults,
  getRequestAISummary,
};

