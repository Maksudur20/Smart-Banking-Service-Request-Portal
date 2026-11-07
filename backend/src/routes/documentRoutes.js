const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter, aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

router.get('/:documentId/access', documentController.getSecureDocumentAccess);
router.post(
  '/:documentId/replace',
  uploadLimiter,
  upload.single('file'),
  documentController.replaceDocument
);

// Aliases matching Section 24 of Practicum Plan
router.post('/:documentId/validate-ai', aiLimiter, aiController.triggerAIValidation);
router.get('/:documentId/ai-results', aiController.getDocumentAIResults);

module.exports = router;

