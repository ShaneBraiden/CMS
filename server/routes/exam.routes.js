const router = require('express').Router();
const {
  getExams,
  createExam,
  updateExam,
  deleteExam
} = require('../controllers/exam.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin } = require('../middleware/role');

router.get('/', protect, getExams);
router.post('/', protect, isTeacherOrAdmin, createExam);
router.put('/:id', protect, isTeacherOrAdmin, updateExam);
router.delete('/:id', protect, isTeacherOrAdmin, deleteExam);

module.exports = router;
