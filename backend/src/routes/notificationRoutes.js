const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
