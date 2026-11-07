const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/requests', reportController.getRequestsReport);
router.get('/requests/export-csv', reportController.exportRequestsCSV);
router.get('/audit-logs', reportController.getAuditLogs);

module.exports = router;
