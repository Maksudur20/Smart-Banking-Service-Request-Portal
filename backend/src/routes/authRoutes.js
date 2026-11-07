const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/uploadMiddleware');

const kycUploadFields = upload.fields([
  { name: 'applicant_photo', maxCount: 1 },
  { name: 'nid_front', maxCount: 1 },
  { name: 'nid_back', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'nominee_photo', maxCount: 1 },
  { name: 'nominee_nid', maxCount: 1 },
  { name: 'utility_bill', maxCount: 1 },
  { name: 'income_proof', maxCount: 1 }
]);

router.post('/register', authLimiter, kycUploadFields, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.patch('/me', authenticateToken, authController.updateProfile);

module.exports = router;

