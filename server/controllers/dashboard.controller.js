const { User, Course, Assignment, Submission, Attendance, Exam, Notification, ODApplication, Batch, Announcement, Event, CourseBatchTeacher } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard stats based on role
// @route   GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { role, batch_id } = req.user;
    const userId = req.user.id;
    let data = {};

    if (role === 'admin') {
      const [totalUsers, totalStudents, totalTeachers, totalCourses, totalBatches, recentAnnouncements, upcomingEvents, recentNotifications] = await Promise.all([
        User.count(),
        User.count({ where: { role: 'student' } }),
        User.count({ where: { role: 'teacher' } }),
        Course.count(),
        Batch.count(),
        Announcement.findAll({
          order: [['created_at', 'DESC']], limit: 5,
          include: [{ model: User, as: 'creator', attributes: ['name'] }]
        }),
        Event.findAll({ where: { event_date: { [Op.gte]: new Date() } }, order: [['event_date', 'ASC']], limit: 5 }),
        Notification.findAll({ order: [['created_at', 'DESC']], limit: 5 })
      ]);

      const fmtAnn = recentAnnouncements.map(a => { const d = a.toJSON(); d._id = d.id; if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; } return d; });
      const fmtEv = upcomingEvents.map(e => { const d = e.toJSON(); d._id = d.id; return d; });
      const fmtNot = recentNotifications.map(n => { const d = n.toJSON(); d._id = d.id; return d; });

      data = { totalUsers, totalStudents, totalTeachers, totalCourses, totalBatches, recentAnnouncements: fmtAnn, upcomingEvents: fmtEv, recentNotifications: fmtNot };

    } else if (role === 'teacher') {
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { teacher_id: userId } });
      const courseIds = [...new Set(cbtRecords.map(r => r.course_id))];
      const courses = await Course.findAll({ where: { id: { [Op.in]: courseIds } } });

      const [assignmentCount, pendingOD, recentAnnouncements, upcomingEvents, recentNotifications] = await Promise.all([
        Assignment.count({ where: { course_id: { [Op.in]: courseIds } } }),
        ODApplication.count({ where: { status: 'pending' } }),
        Announcement.findAll({
          order: [['created_at', 'DESC']], limit: 5,
          include: [{ model: User, as: 'creator', attributes: ['name'] }]
        }),
        Event.findAll({ where: { event_date: { [Op.gte]: new Date() } }, order: [['event_date', 'ASC']], limit: 5 }),
        Notification.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], limit: 5 })
      ]);

      // Count total students across all batches for teacher's courses
      const batchIds = [...new Set(cbtRecords.map(r => r.batch_id))];
      const totalStudents = await User.count({ where: { batch_id: { [Op.in]: batchIds }, role: 'student' } });

      // Upcoming deadlines
      const upcomingDeadlines = await Assignment.findAll({
        where: { course_id: { [Op.in]: courseIds }, due_date: { [Op.gte]: new Date() } },
        order: [['due_date', 'ASC']], limit: 5,
        include: [{ model: Course, as: 'course', attributes: ['name'] }]
      });

      const fmtAnn = recentAnnouncements.map(a => { const d = a.toJSON(); d._id = d.id; if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; } return d; });
      const fmtEv = upcomingEvents.map(e => { const d = e.toJSON(); d._id = d.id; return d; });
      const fmtNot = recentNotifications.map(n => { const d = n.toJSON(); d._id = d.id; return d; });
      const fmtDl = upcomingDeadlines.map(a => { const d = a.toJSON(); d._id = d.id; if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name }; delete d.course; } return d; });

      data = {
        myCourses: courses.length, courseCount: courses.length,
        totalStudents, totalAssignments: assignmentCount, assignmentCount, pendingOD,
        upcomingDeadlines: fmtDl, recentAnnouncements: fmtAnn, upcomingEvents: fmtEv, recentNotifications: fmtNot
      };

    } else if (role === 'student') {
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { batch_id }, attributes: ['course_id'] });
      const courseIds = cbtRecords.map(r => r.course_id);
      const courses = await Course.findAll({ where: { id: { [Op.in]: courseIds } } });

      const [assignments, submissions, attendanceRecords, upcomingExams, recentNotifications, recentAnnouncements, upcomingEvents] = await Promise.all([
        Assignment.findAll({ where: { course_id: { [Op.in]: courseIds } } }),
        Submission.findAll({ where: { student_id: userId } }),
        Attendance.findAll({ where: { student_id: userId } }),
        Exam.findAll({
          where: { course_id: { [Op.in]: courseIds }, exam_date: { [Op.gte]: new Date() } },
          order: [['exam_date', 'ASC']], limit: 5,
          include: [{ model: Course, as: 'course', attributes: ['name'] }]
        }),
        Notification.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], limit: 5 }),
        Announcement.findAll({
          where: { target_audience: { [Op.in]: ['all', 'students'] } },
          order: [['created_at', 'DESC']], limit: 5,
          include: [{ model: User, as: 'creator', attributes: ['name'] }]
        }),
        Event.findAll({ where: { event_date: { [Op.gte]: new Date() } }, order: [['event_date', 'ASC']], limit: 5 })
      ]);

      const submittedIds = new Set(submissions.map(s => String(s.assignment_id)));
      const pendingAssignments = assignments.filter(a => !submittedIds.has(String(a.id))).length;

      const totalAttendance = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      const fmtExams = upcomingExams.map(e => { const d = e.toJSON(); d._id = d.id; if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name }; delete d.course; } return d; });
      const fmtNot = recentNotifications.map(n => { const d = n.toJSON(); d._id = d.id; return d; });
      const fmtAnn = recentAnnouncements.map(a => { const d = a.toJSON(); d._id = d.id; if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; } return d; });
      const fmtEv = upcomingEvents.map(e => { const d = e.toJSON(); d._id = d.id; return d; });

      data = {
        myCourses: courses.length, courseCount: courses.length,
        pendingAssignments, attendancePercentage,
        upcomingExams: fmtExams, recentNotifications: fmtNot, recentAnnouncements: fmtAnn, upcomingEvents: fmtEv
      };
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
