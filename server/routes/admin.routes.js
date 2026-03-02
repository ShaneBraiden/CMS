const router = require('express').Router();
const {
  getUsers,
  createUser,
  bulkCreateUsers,
  deleteUser,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  manageBatchStudents,
  bulkAssignByRange,
  getAdminTimetables,
  getAttendanceReports,
  getAttendanceByCourse,
  getAttendanceByDate,
  getAttendanceByStudent
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/users/bulk', bulkCreateUsers);
router.delete('/users/:id', deleteUser);

// Batch management
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.get('/batches/:id/students', getBatchStudents);
router.post('/batches/:id/students', manageBatchStudents);
router.post('/batches/:id/students/range', bulkAssignByRange);

// Timetable management
router.get('/timetables', getAdminTimetables);

// Attendance reports
router.get('/attendance/reports', getAttendanceReports);
router.get('/attendance/by-course', getAttendanceByCourse);
router.get('/attendance/by-date', getAttendanceByDate);
router.get('/attendance/by-student', getAttendanceByStudent);

module.exports = router;
