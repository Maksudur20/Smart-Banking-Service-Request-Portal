const notificationService = require('../services/notificationService');

/**
 * Get user's notifications
 */
async function getNotifications(req, res, next) {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const result = await notificationService.getUserNotifications(
      req.user.id,
      parseInt(limit, 10),
      offset
    );

    const unreadCount = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      unreadCount,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a single notification as read
 */
async function markNotificationAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    await notificationService.markNotificationAsRead(notificationId, req.user.id);
    res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res, next) {
  try {
    const count = await notificationService.markAllNotificationsAsRead(req.user.id);
    res.json({
      success: true,
      message: `${count} notifications marked as read.`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
};
