const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);

// Customer routes
router.get('/my', kycController.getMyKYC);
router.post('/reupload', uploadLimiter, upload.single('file'), kycController.reuploadKYCDocument);

// Admin routes
router.get('/admin/applications', requireRole('ADMIN'), kycController.getAdminKYCApplications);
router.get('/admin/applications/:customerId', requireRole('ADMIN'), kycController.getAdminKYCApplicationDetails);
router.post('/admin/applications/:customerId/decision', requireRole('ADMIN'), kycController.reviewKYCApplication);
router.post('/admin/documents/:docId/replace', requireRole('ADMIN'), uploadLimiter, upload.single('file'), kycController.adminReplaceKYCDocument);
router.delete('/admin/documents/:docId', requireRole('ADMIN'), kycController.adminDeleteKYCDocument);

module.exports = router;

