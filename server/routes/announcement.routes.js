const router = require('express').Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcement.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getAnnouncements);
router.post('/', protect, isTeacherOrAdmin, createAnnouncement);
router.put('/:id', protect, isTeacherOrAdmin, updateAnnouncement);
router.delete('/:id', protect, isTeacherOrAdmin, deleteAnnouncement);

module.exports = router;
