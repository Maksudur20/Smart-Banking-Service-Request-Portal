const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/customers', adminController.getCustomers);
router.get('/requests', adminController.getAdminRequests);
router.get('/requests/:requestId', adminController.getAdminRequestDetails);
router.post('/requests/:requestId/decision', adminController.makeDecision);

module.exports = router;
