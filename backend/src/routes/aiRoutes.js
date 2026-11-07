const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

// Document specific AI validations (requires authentication)
router.post('/documents/:documentId/validate', authenticateToken, aiLimiter, aiController.triggerAIValidation);
router.get('/documents/:documentId/results', authenticateToken, aiController.getDocumentAIResults);
router.get('/requests/:requestId/summary', authenticateToken, aiLimiter, aiController.getRequestAISummary);

// Interactive Floating AI Assistant Chat (accessible to authenticated users AND public visitors)
router.post('/chat', optionalAuth, aiController.chatWithAIAssistant);

module.exports = router;
