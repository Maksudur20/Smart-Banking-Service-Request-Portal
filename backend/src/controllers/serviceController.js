const db = require('../config/database');

/**
 * Get all available banking services
 */
async function getServices(req, res, next) {
  try {
    const query = `
      SELECT s.*, 
             COUNT(sdr.id) as required_document_count
      FROM services s
      LEFT JOIN service_document_requirements sdr ON sdr.service_id = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.id ASC
    `;
    const result = await db.query(query);
    res.json({
      success: true,
      services: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single service with its document checklist requirements
 */
async function getServiceRequirements(req, res, next) {
  try {
    const { serviceId } = req.params;

    const serviceQuery = `SELECT * FROM services WHERE id = $1 AND is_active = TRUE`;
    const serviceRes = await db.query(serviceQuery, [serviceId]);

    if (serviceRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banking service not found.',
      });
    }

    const reqQuery = `
      SELECT sdr.id, sdr.service_id, sdr.document_type_id, sdr.is_required, 
             sdr.allowed_extensions, sdr.max_size_mb,
             dt.name AS document_name, dt.description AS document_description
      FROM service_document_requirements sdr
      JOIN document_types dt ON dt.id = sdr.document_type_id
      WHERE sdr.service_id = $1
      ORDER BY sdr.is_required DESC, dt.name ASC
    `;
    const reqRes = await db.query(reqQuery, [serviceId]);

    res.json({
      success: true,
      service: serviceRes.rows[0],
      requirements: reqRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all document types catalogue
 */
async function getDocumentTypes(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM document_types ORDER BY name ASC');
    res.json({
      success: true,
      documentTypes: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getServices,
  getServiceRequirements,
  getDocumentTypes,
};
