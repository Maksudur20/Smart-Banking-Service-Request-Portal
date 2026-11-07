const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Customer complaint endpoints
router.post('/', complaintController.createComplaint);
router.get('/my', complaintController.getCustomerComplaints);

// Admin complaint endpoints
router.get('/admin', requireAdmin, complaintController.getAdminComplaints);
router.patch('/admin/:complaintId', requireAdmin, complaintController.updateComplaint);

module.exports = router;

