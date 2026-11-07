const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

// Document specific AI validations
router.post('/documents/:documentId/validate', aiLimiter, aiController.triggerAIValidation);
router.get('/documents/:documentId/results', aiController.getDocumentAIResults);
router.get('/requests/:requestId/summary', aiLimiter, aiController.getRequestAISummary);

// Interactive Floating AI Assistant Chat
router.post('/chat', aiController.chatWithAIAssistant);

module.exports = router;
