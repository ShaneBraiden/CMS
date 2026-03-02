const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Batch = require('../models/Batch');

// @desc    Get analytics (role-based)
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { role, _id, batch_id } = req.user;

    if (role === 'admin') {
      // ─── Admin analytics ───
      const [
        userCounts,
        courseCount,
        batchCount,
        attendanceByCourse,
        monthlyAttendance,
        batchWiseStudents
      ] = await Promise.all([
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Course.countDocuments(),
        Batch.countDocuments(),
        // Attendance % per course
        Attendance.aggregate([
          {
            $group: {
              _id: '$course_id',
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          {
            $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' }
          },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: { $ifNull: ['$course.name', 'Unknown'] },
              total: 1,
              present: 1,
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              }
            }
          },
          { $sort: { name: 1 } }
        ]),
        // Monthly attendance trend (last 6 months)
        Attendance.aggregate([
          { $match: { date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
          {
            $group: {
              _id: { year: { $year: '$date' }, month: { $month: '$date' } },
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          {
            $project: {
              _id: 0,
              month: {
                $concat: [
                  { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], '$_id.month'] },
                  ' ', { $toString: '$_id.year' }
                ]
              },
              total: 1,
              present: 1,
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              },
              sortKey: { $add: [{ $multiply: ['$_id.year', 100] }, '$_id.month'] }
            }
          },
          { $sort: { sortKey: 1 } },
          { $project: { sortKey: 0 } }
        ]),
        // Students per batch
        User.aggregate([
          { $match: { role: 'student', batch_id: { $ne: null } } },
          { $group: { _id: '$batch_id', count: { $sum: 1 } } },
          { $lookup: { from: 'batches', localField: '_id', foreignField: '_id', as: 'batch' } },
          { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
          { $project: { name: { $ifNull: ['$batch.name', 'Unassigned'] }, count: 1 } },
          { $sort: { name: 1 } }
        ])
      ]);

      const overview = {};
      userCounts.forEach(u => { overview[u._id + 's'] = u.count; });
      overview.courses = courseCount;
      overview.batches = batchCount;

      return res.json({
        success: true,
        data: {
          role: 'admin',
          overview,
          attendanceByCourse,
          monthlyAttendance,
          batchWiseStudents
        }
      });

    } else if (role === 'teacher') {
      // ─── Teacher analytics ───
      const courses = await Course.find({ 'batches.teacher_id': _id });
      const courseIds = courses.map(c => c._id);

      const [attendanceByCourse, monthlyAttendance, assignmentStats] = await Promise.all([
        // Attendance per course
        Attendance.aggregate([
          { $match: { course_id: { $in: courseIds } } },
          {
            $group: {
              _id: '$course_id',
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: { $ifNull: ['$course.name', 'Unknown'] },
              total: 1, present: 1,
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              }
            }
          }
        ]),
        // Monthly attendance for teacher's courses
        Attendance.aggregate([
          { $match: { course_id: { $in: courseIds }, date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
          {
            $group: {
              _id: { year: { $year: '$date' }, month: { $month: '$date' } },
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          {
            $project: {
              _id: 0,
              month: {
                $concat: [
                  { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], '$_id.month'] },
                  ' ', { $toString: '$_id.year' }
                ]
              },
              total: 1, present: 1,
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              },
              sortKey: { $add: [{ $multiply: ['$_id.year', 100] }, '$_id.month'] }
            }
          },
          { $sort: { sortKey: 1 } },
          { $project: { sortKey: 0 } }
        ]),
        // Assignment submission stats per course
        Assignment.aggregate([
          { $match: { course_id: { $in: courseIds } } },
          {
            $lookup: {
              from: 'submissions', localField: '_id', foreignField: 'assignment_id', as: 'submissions'
            }
          },
          {
            $lookup: { from: 'courses', localField: 'course_id', foreignField: '_id', as: 'course' }
          },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: '$title',
              courseName: { $ifNull: ['$course.name', 'Unknown'] },
              totalSubmissions: { $size: '$submissions' },
              due_date: 1
            }
          },
          { $sort: { due_date: -1 } },
          { $limit: 10 }
        ])
      ]);

      return res.json({
        success: true,
        data: {
          role: 'teacher',
          courseCount: courses.length,
          attendanceByCourse,
          monthlyAttendance,
          assignmentStats
        }
      });

    } else {
      // ─── Student analytics ───
      const courses = await Course.find({ 'batches.batch_id': batch_id }).select('_id name');
      const courseIds = courses.map(c => c._id);

      const [attendanceByCourse, monthlyAttendance, assignmentStats] = await Promise.all([
        // My attendance per course
        Attendance.aggregate([
          { $match: { student_id: _id, course_id: { $in: courseIds } } },
          {
            $group: {
              _id: '$course_id',
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: { $ifNull: ['$course.name', 'Unknown'] },
              total: 1, present: 1,
              absent: { $subtract: ['$total', '$present'] },
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              }
            }
          }
        ]),
        // My monthly attendance trend
        Attendance.aggregate([
          { $match: { student_id: _id, date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
          {
            $group: {
              _id: { year: { $year: '$date' }, month: { $month: '$date' } },
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          {
            $project: {
              _id: 0,
              month: {
                $concat: [
                  { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], '$_id.month'] },
                  ' ', { $toString: '$_id.year' }
                ]
              },
              total: 1, present: 1,
              percentage: {
                $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
              },
              sortKey: { $add: [{ $multiply: ['$_id.year', 100] }, '$_id.month'] }
            }
          },
          { $sort: { sortKey: 1 } },
          { $project: { sortKey: 0 } }
        ]),
        // My submission status
        Assignment.aggregate([
          { $match: { course_id: { $in: courseIds } } },
          {
            $lookup: {
              from: 'submissions',
              let: { assignId: '$_id' },
              pipeline: [
                { $match: { $expr: { $and: [{ $eq: ['$assignment_id', '$$assignId'] }, { $eq: ['$student_id', _id] }] } } }
              ],
              as: 'mySubmission'
            }
          },
          { $lookup: { from: 'courses', localField: 'course_id', foreignField: '_id', as: 'course' } },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              title: 1,
              courseName: { $ifNull: ['$course.name', 'Unknown'] },
              due_date: 1,
              submitted: { $gt: [{ $size: '$mySubmission' }, 0] }
            }
          },
          { $sort: { due_date: -1 } },
          { $limit: 10 }
        ])
      ]);

      // Overall attendance
      const totalRecords = attendanceByCourse.reduce((sum, c) => sum + c.total, 0);
      const totalPresent = attendanceByCourse.reduce((sum, c) => sum + c.present, 0);
      const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      return res.json({
        success: true,
        data: {
          role: 'student',
          overallAttendance: overallPercentage,
          courseCount: courses.length,
          attendanceByCourse,
          monthlyAttendance,
          assignmentStats
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
