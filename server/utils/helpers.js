const Notification = require('../models/Notification');

/**
 * Create a single notification
 */
const createNotification = async (userId, message, type = 'general', referenceId = null) => {
  try {
    await Notification.create({
      user_id: userId,
      message,
      type,
      reference_id: referenceId
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

/**
 * Create notifications for multiple users at once
 */
const createBulkNotifications = async (userIds, message, type = 'general', referenceId = null) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      message,
      type,
      reference_id: referenceId
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating bulk notifications:', error.message);
  }
};

module.exports = { createNotification, createBulkNotifications };
