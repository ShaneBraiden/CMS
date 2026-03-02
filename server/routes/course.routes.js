const router = require('express').Router();
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/course.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getCourses);
router.post('/', protect, isTeacherOrAdmin, createCourse);
router.put('/:id', protect, isTeacherOrAdmin, updateCourse);
router.delete('/:id', protect, isTeacherOrAdmin, deleteCourse);

module.exports = router;
