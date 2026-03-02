const router = require('express').Router();
const {
  getAttendance,
  markAttendance,
  getAttendanceReport,
  getAttendanceHistory,
  editAttendance
} = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getAttendance);
router.post('/', protect, isTeacherOrAdmin, markAttendance);
router.get('/report', protect, isTeacherOrAdmin, getAttendanceReport);
router.get('/history', protect, isTeacherOrAdmin, getAttendanceHistory);
router.put('/:id', protect, isTeacherOrAdmin, editAttendance);

module.exports = router;
