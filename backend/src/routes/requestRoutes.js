const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All request routes require authentication
router.use(authenticateToken);

router.post('/', requestController.createRequest);
router.get('/', requestController.getCustomerRequests);
router.get('/:requestId', requestController.getRequestById);
router.post('/:requestId/cancel', requestController.cancelRequest);

// Document upload attached to a specific request
router.post(
  '/:requestId/documents',
  uploadLimiter,
  upload.single('file'),
  documentController.uploadDocument
);

module.exports = router;
