const router = require('express').Router();
const {
  getMarks,
  addMarks,
  updateMarks,
  deleteMarks
} = require('../controllers/marks.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getMarks);
router.post('/', protect, isTeacherOrAdmin, addMarks);
router.put('/:id', protect, isTeacherOrAdmin, updateMarks);
router.delete('/:id', protect, isTeacherOrAdmin, deleteMarks);

module.exports = router;
