const router = require('express').Router();
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions
} = require('../controllers/assignment.controller');
const { protect } = require('../middleware/auth');
const { isTeacherOrAdmin, isStudent } = require('../middleware/role');
const { upload } = require('../middleware/upload');

router.get('/', protect, getAssignments);
router.post('/', protect, isTeacherOrAdmin, upload.single('file'), createAssignment);
router.put('/:id', protect, isTeacherOrAdmin, upload.single('file'), updateAssignment);
router.delete('/:id', protect, isTeacherOrAdmin, deleteAssignment);
router.post('/:id/submit', protect, isStudent, upload.single('file'), submitAssignment);
router.get('/:id/submissions', protect, isTeacherOrAdmin, getSubmissions);

module.exports = router;
