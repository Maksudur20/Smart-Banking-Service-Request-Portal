const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

// Customer endpoints
router.post('/', uploadLimiter, upload.single('slip'), depositController.submitDeposit);
router.get('/my', depositController.getMyDeposits);

// Admin endpoints
router.get('/admin', requireRole('ADMIN'), depositController.getAdminDeposits);
router.post('/admin/:depositId/verify', requireRole('ADMIN'), depositController.verifyDeposit);

module.exports = router;
