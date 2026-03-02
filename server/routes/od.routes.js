const router = require('express').Router();
const {
  applyOD,
  getODStatus,
  getODApprovals,
  approveRejectOD
} = require('../controllers/od.controller');
const { protect } = require('../middleware/auth');
const { isStudent, isTeacherOrAdmin } = require('../middleware/role');

router.post('/', protect, isStudent, applyOD);
router.get('/status', protect, isStudent, getODStatus);
router.get('/approvals', protect, isTeacherOrAdmin, getODApprovals);
router.put('/:id', protect, isTeacherOrAdmin, approveRejectOD);

module.exports = router;
