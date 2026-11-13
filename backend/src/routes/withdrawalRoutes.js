const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

// Customer endpoints
router.post('/', uploadLimiter, upload.single('cheque_image'), withdrawalController.submitWithdrawal);
router.get('/my', withdrawalController.getMyWithdrawals);
router.get('/:id/receipt', withdrawalController.getWithdrawalReceipt);

// Admin endpoints
router.get('/admin', requireRole('ADMIN'), withdrawalController.getAdminWithdrawals);
router.get('/admin/:id', requireRole('ADMIN'), withdrawalController.getAdminWithdrawalDetails);
router.patch('/admin/:id/status', requireRole('ADMIN'), withdrawalController.updateWithdrawalStatus);

module.exports = router;

