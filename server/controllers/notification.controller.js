const { Notification } = require('../models');

// @desc    Get user's notifications (marks all as read)
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Mark all as read
    await Notification.update(
      { read: true },
      { where: { user_id: req.user.id, read: false } }
    );

    const formatted = notifications.map(n => { const d = n.toJSON(); d._id = d.id; return d; });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { user_id: req.user.id, read: false } });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await notification.update({ read: true });
    const data = notification.toJSON(); data._id = data.id;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
