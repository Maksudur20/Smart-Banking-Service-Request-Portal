const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

router.get('/:documentId/access', documentController.getSecureDocumentAccess);
router.post(
  '/:documentId/replace',
  uploadLimiter,
  upload.single('file'),
  documentController.replaceDocument
);

module.exports = router;
