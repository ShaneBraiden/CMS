const router = require('express').Router();
const {
  getTimetables,
  createOrUpdateTimetable,
  deleteTimetable
} = require('../controllers/timetable.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getTimetables);
router.post('/', protect, isTeacherOrAdmin, createOrUpdateTimetable);
router.delete('/:id', protect, isTeacherOrAdmin, deleteTimetable);

module.exports = router;
