const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', transactionController.getTransactions);
router.patch('/:transactionId/monitoring', transactionController.updateMonitoringStatus);

module.exports = router;

