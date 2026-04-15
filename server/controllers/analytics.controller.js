const { User, Course, Attendance, Assignment, Submission, Batch, CourseBatchTeacher } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// @desc    Get analytics (role-based)
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { role, batch_id } = req.user;
    const userId = req.user.id;

    if (role === 'admin') {
      // ─── Admin analytics ───
      const [students, teachers, admins, courseCount, batchCount] = await Promise.all([
        User.count({ where: { role: 'student' } }),
        User.count({ where: { role: 'teacher' } }),
        User.count({ where: { role: 'admin' } }),
        Course.count(),
        Batch.count()
      ]);

      // Attendance % per course
      const attendanceByCourse = await Attendance.findAll({
        attributes: [
          'course_id',
          [fn('COUNT', col('Attendance.id')), 'total'],
          [fn('SUM', literal("CASE WHEN \"Attendance\".\"status\" = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        include: [{ model: Course, as: 'course', attributes: ['name'] }],
        group: ['course_id', 'course.id'],
        raw: true, nest: true
      });

      const fmtAttByCourse = attendanceByCourse.map(d => ({
        _id: d.course_id,
        name: d.course ? d.course.name : 'Unknown',
        total: parseInt(d.total),
        present: parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // Monthly attendance trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const monthlyRaw = await Attendance.findAll({
        where: { date: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn('EXTRACT', literal("YEAR FROM date")), 'yr'],
          [fn('EXTRACT', literal("MONTH FROM date")), 'mo'],
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        group: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        order: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        raw: true
      });

      const monthlyAttendance = monthlyRaw.map(d => ({
        month: `${monthNames[parseInt(d.mo)]} ${d.yr}`,
        total: parseInt(d.total),
        present: parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // Students per batch
      const batchWiseRaw = await User.findAll({
        where: { role: 'student', batch_id: { [Op.ne]: null } },
        attributes: ['batch_id', [fn('COUNT', col('User.id')), 'count']],
        include: [{ model: Batch, as: 'batch', attributes: ['name'] }],
        group: ['batch_id', 'batch.id'],
        raw: true, nest: true
      });

      const batchWiseStudents = batchWiseRaw.map(d => ({
        _id: d.batch_id,
        name: d.batch ? d.batch.name : 'Unassigned',
        count: parseInt(d.count)
      }));

      return res.json({
        success: true,
        data: {
          role: 'admin',
          overview: { students, teachers, admins, courses: courseCount, batches: batchCount },
          attendanceByCourse: fmtAttByCourse,
          monthlyAttendance,
          batchWiseStudents
        }
      });

    } else if (role === 'teacher') {
      // ─── Teacher analytics ───
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { teacher_id: userId } });
      const courseIds = [...new Set(cbtRecords.map(r => r.course_id))];
      const courses = await Course.findAll({ where: { id: { [Op.in]: courseIds } } });

      // Attendance per course
      const attendanceByCourse = await Attendance.findAll({
        where: { course_id: { [Op.in]: courseIds } },
        attributes: [
          'course_id',
          [fn('COUNT', col('Attendance.id')), 'total'],
          [fn('SUM', literal("CASE WHEN \"Attendance\".\"status\" = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        include: [{ model: Course, as: 'course', attributes: ['name'] }],
        group: ['course_id', 'course.id'],
        raw: true, nest: true
      });

      const fmtAttByCourse = attendanceByCourse.map(d => ({
        _id: d.course_id,
        name: d.course ? d.course.name : 'Unknown',
        total: parseInt(d.total),
        present: parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // Monthly attendance
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const monthlyRaw = await Attendance.findAll({
        where: { course_id: { [Op.in]: courseIds }, date: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn('EXTRACT', literal("YEAR FROM date")), 'yr'],
          [fn('EXTRACT', literal("MONTH FROM date")), 'mo'],
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        group: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        order: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        raw: true
      });

      const monthlyAttendance = monthlyRaw.map(d => ({
        month: `${monthNames[parseInt(d.mo)]} ${d.yr}`,
        total: parseInt(d.total),
        present: parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // Assignment submission stats
      const assignments = await Assignment.findAll({
        where: { course_id: { [Op.in]: courseIds } },
        include: [
          { model: Course, as: 'course', attributes: ['name'] },
          { model: Submission, as: 'submissions' }
        ],
        order: [['due_date', 'DESC']],
        limit: 10
      });

      const assignmentStats = assignments.map(a => ({
        _id: a.id,
        name: a.title,
        courseName: a.course ? a.course.name : 'Unknown',
        totalSubmissions: a.submissions ? a.submissions.length : 0,
        due_date: a.due_date
      }));

      return res.json({
        success: true,
        data: {
          role: 'teacher',
          courseCount: courses.length,
          attendanceByCourse: fmtAttByCourse,
          monthlyAttendance,
          assignmentStats
        }
      });

    } else {
      // ─── Student analytics ───
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { batch_id }, attributes: ['course_id'] });
      const courseIds = cbtRecords.map(r => r.course_id);
      const courses = await Course.findAll({ where: { id: { [Op.in]: courseIds } }, attributes: ['id', 'name'] });

      // My attendance per course
      const attendanceByCourse = await Attendance.findAll({
        where: { student_id: userId, course_id: { [Op.in]: courseIds } },
        attributes: [
          'course_id',
          [fn('COUNT', col('Attendance.id')), 'total'],
          [fn('SUM', literal("CASE WHEN \"Attendance\".\"status\" = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        include: [{ model: Course, as: 'course', attributes: ['name'] }],
        group: ['course_id', 'course.id'],
        raw: true, nest: true
      });

      const fmtAttByCourse = attendanceByCourse.map(d => ({
        _id: d.course_id,
        name: d.course ? d.course.name : 'Unknown',
        total: parseInt(d.total),
        present: parseInt(d.present),
        absent: parseInt(d.total) - parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // Monthly attendance
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const monthlyRaw = await Attendance.findAll({
        where: { student_id: userId, date: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn('EXTRACT', literal("YEAR FROM date")), 'yr'],
          [fn('EXTRACT', literal("MONTH FROM date")), 'mo'],
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
        ],
        group: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        order: [literal("EXTRACT(YEAR FROM date)"), literal("EXTRACT(MONTH FROM date)")],
        raw: true
      });

      const monthlyAttendance = monthlyRaw.map(d => ({
        month: `${monthNames[parseInt(d.mo)]} ${d.yr}`,
        total: parseInt(d.total),
        present: parseInt(d.present),
        percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
      }));

      // My submission status
      const assignments = await Assignment.findAll({
        where: { course_id: { [Op.in]: courseIds } },
        include: [
          { model: Course, as: 'course', attributes: ['name'] },
          { model: Submission, as: 'submissions', where: { student_id: userId }, required: false }
        ],
        order: [['due_date', 'DESC']],
        limit: 10
      });

      const assignmentStats = assignments.map(a => ({
        _id: a.id,
        title: a.title,
        courseName: a.course ? a.course.name : 'Unknown',
        due_date: a.due_date,
        submitted: a.submissions && a.submissions.length > 0
      }));

      // Overall attendance
      const totalRecords = fmtAttByCourse.reduce((sum, c) => sum + c.total, 0);
      const totalPresent = fmtAttByCourse.reduce((sum, c) => sum + c.present, 0);
      const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      return res.json({
        success: true,
        data: {
          role: 'student',
          overallAttendance: overallPercentage,
          courseCount: courses.length,
          attendanceByCourse: fmtAttByCourse,
          monthlyAttendance,
          assignmentStats
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
