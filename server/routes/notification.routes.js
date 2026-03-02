const router = require('express').Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
