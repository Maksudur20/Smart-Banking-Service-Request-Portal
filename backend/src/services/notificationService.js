const db = require('../config/database');

/**
 * Creates an in-app notification record for a user
 */
async function createNotification({ userId, requestId = null, complaintId = null, title, message }) {
  try {
    const query = `
      INSERT INTO notifications (user_id, request_id, complaint_id, title, message, channel, is_read, created_at, sent_at)
      VALUES ($1, $2, $3, $4, $5, 'IN_APP', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await db.query(query, [userId, requestId, complaintId, title, message]);
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Marks a notification as read
 */
async function markNotificationAsRead(notificationId, userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  const result = await db.query(query, [notificationId, userId]);
  return result.rows[0];
}

/**
 * Marks all notifications for a user as read
 */
async function markAllNotificationsAsRead(userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1 AND is_read = FALSE
    RETURNING id
  `;
  const result = await db.query(query, [userId]);
  return result.rowCount;
}

/**
 * Retrieves paginated notifications for a user
 */
async function getUserNotifications(userId, limit = 20, offset = 0) {
  const countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1`;
  const countResult = await db.query(countQuery, [userId]);
  const total = parseInt(countResult.rows[0].count, 10);

  const query = `
    SELECT n.*, sr.request_number, c.complaint_number
    FROM notifications n
    LEFT JOIN service_requests sr ON sr.id = n.request_id
    LEFT JOIN complaints c ON c.id = n.complaint_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [userId, limit, offset]);

  return {
    notifications: result.rows,
    total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Gets count of unread notifications
 */
async function getUnreadCount(userId) {
  const query = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`;
  const result = await db.query(query, [userId]);
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotifications,
  getUnreadCount,
};

