const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const closureController = require('../controllers/closureController');

// Multer memory storage for multiple document uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and PDF files are allowed.'), false);
    }
  }
});

const closureUploadFields = upload.fields([
  { name: 'doc_nid', maxCount: 1 },
  { name: 'doc_application', maxCount: 1 },
  { name: 'doc_signature', maxCount: 1 },
  { name: 'doc_unused_cheques', maxCount: 1 },
  { name: 'doc_debit_card', maxCount: 1 },
  { name: 'doc_additional', maxCount: 1 }
]);

// Public fee schedule view
router.get('/fee-schedules', closureController.getFeeSchedules);

// All subsequent routes require authentication
router.use(authenticateToken);

// Customer endpoints
router.post('/', closureUploadFields, closureController.submitClosureRequest);
router.get('/my', closureController.getMyClosureRequests);
router.get('/:id', closureController.getClosureRequestById);

// Admin endpoints
router.get('/admin/all', requireAdmin, closureController.adminGetAllClosureRequests);
router.patch('/admin/:id/checklist', requireAdmin, closureController.adminUpdateChecklist);
router.post('/admin/:id/decision', requireAdmin, closureController.adminDecideClosure);
router.put('/admin/fee-schedules', requireAdmin, closureController.adminUpdateFeeSchedule);

module.exports = router;
