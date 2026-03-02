const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');
const ODApplication = require('../models/ODApplication');
const Batch = require('../models/Batch');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');

// @desc    Get dashboard stats based on role
// @route   GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { role, _id, batch_id } = req.user;
    let data = {};

    if (role === 'admin') {
      const [totalUsers, totalStudents, totalTeachers, totalCourses, totalBatches, recentAnnouncements, upcomingEvents, recentNotifications] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        Course.countDocuments(),
        Batch.countDocuments(),
        Announcement.find().sort({ created_at: -1 }).limit(5).populate('created_by', 'name'),
        Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
        Notification.find().sort({ created_at: -1 }).limit(5)
      ]);
      data = { totalUsers, totalStudents, totalTeachers, totalCourses, totalBatches, recentAnnouncements, upcomingEvents, recentNotifications };

    } else if (role === 'teacher') {
      const courses = await Course.find({ 'batches.teacher_id': _id });
      const courseIds = courses.map(c => c._id);
      const [assignmentCount, pendingOD, recentAnnouncements, upcomingEvents, recentNotifications] = await Promise.all([
        Assignment.countDocuments({ course_id: { $in: courseIds } }),
        ODApplication.countDocuments({ status: 'pending' }),
        Announcement.find().sort({ created_at: -1 }).limit(5).populate('created_by', 'name'),
        Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
        Notification.find({ user_id: _id }).sort({ created_at: -1 }).limit(5)
      ]);

      // Count total students across all batches for teacher's courses
      const batchIds = [...new Set(courses.flatMap(c => c.batches.map(b => b.batch_id.toString())))];
      const totalStudents = await User.countDocuments({ batch_id: { $in: batchIds }, role: 'student' });

      // Upcoming deadlines
      const upcomingDeadlines = await Assignment.find({
        course_id: { $in: courseIds },
        due_date: { $gte: new Date() }
      }).sort({ due_date: 1 }).limit(5).populate('course_id', 'name');

      data = {
        myCourses: courses.length,
        courseCount: courses.length,
        totalStudents,
        totalAssignments: assignmentCount,
        assignmentCount,
        pendingOD,
        upcomingDeadlines,
        recentAnnouncements,
        upcomingEvents,
        recentNotifications
      };

    } else if (role === 'student') {
      const courses = await Course.find({ 'batches.batch_id': batch_id });
      const courseIds = courses.map(c => c._id);

      const [assignments, submissions, attendanceRecords, upcomingExams, recentNotifications, recentAnnouncements, upcomingEvents] = await Promise.all([
        Assignment.find({ course_id: { $in: courseIds } }),
        Submission.find({ student_id: _id }),
        Attendance.find({ student_id: _id }),
        Exam.find({ course_id: { $in: courseIds }, exam_date: { $gte: new Date() } })
          .sort({ exam_date: 1 }).limit(5).populate('course_id', 'name'),
        Notification.find({ user_id: _id }).sort({ created_at: -1 }).limit(5),
        Announcement.find({ $or: [{ target_audience: 'all' }, { target_audience: 'students' }] }).sort({ created_at: -1 }).limit(5).populate('created_by', 'name'),
        Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5)
      ]);

      const submittedIds = new Set(submissions.map(s => s.assignment_id.toString()));
      const pendingAssignments = assignments.filter(a => !submittedIds.has(a._id.toString())).length;

      // Attendance percentage
      const totalAttendance = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      data = {
        myCourses: courses.length,
        courseCount: courses.length,
        pendingAssignments,
        attendancePercentage,
        upcomingExams,
        recentNotifications,
        recentAnnouncements,
        upcomingEvents
      };
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
