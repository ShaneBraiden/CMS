const { Attendance, Course, User, ODApplication, Timetable, TimetableSlot, CourseBatchTeacher, Batch } = require('../models');
const { Op } = require('sequelize');

// @desc    Get attendance (role-filtered)
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { role, batch_id } = req.user;
    const userId = req.user.id;

    if (role === 'student') {
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { batch_id }, attributes: ['course_id'] });
      const courseIds = cbtRecords.map(r => r.course_id);
      const courses = await Course.findAll({ where: { id: { [Op.in]: courseIds } } });

      const courseData = await Promise.all(courses.map(async (course) => {
        const records = await Attendance.findAll({ where: { student_id: userId, course_id: course.id } });
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return {
          course: { _id: course.id, name: course.name, code: course.code },
          total,
          present,
          absent: total - present,
          percentage
        };
      }));
      return res.json({ success: true, data: courseData });
    }

    if (role === 'teacher') {
      const cbtRecords = await CourseBatchTeacher.findAll({
        where: { teacher_id: userId },
        include: [
          { model: Course, as: 'course' },
          { model: Batch, as: 'batch', attributes: ['name'] }
        ]
      });
      const courses = cbtRecords.map(r => {
        const c = r.course.toJSON();
        c._id = c.id;
        c.batch_id = r.batch ? { _id: r.batch_id, name: r.batch.name } : r.batch_id;
        return c;
      });
      return res.json({ success: true, data: courses });
    }

    // Admin: return all courses
    const courses = await Course.findAll({
      include: [{
        model: CourseBatchTeacher, as: 'courseBatches',
        include: [
          { model: User, as: 'teacher', attributes: ['name'] },
          { model: Batch, as: 'batch', attributes: ['name'] }
        ]
      }]
    });
    const formatted = courses.map(c => { const d = c.toJSON(); d._id = d.id; return d; });
    return res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance for a specific course
// @route   GET /api/attendance/course/:course_id
exports.getAttendanceByCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { date } = req.query;

    let whereClause = { course_id };
    if (date) {
      whereClause.date = date; // DATEONLY comparison
    }

    const records = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['date', 'DESC']]
    });

    const formatted = records.map(r => {
      const d = r.toJSON();
      d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark attendance (bulk)
// @route   POST /api/attendance
// Body: { course_id, date, records: [{ student_id, hourly_status: ['present','absent',...] }] }
exports.markAttendance = async (req, res) => {
  try {
    const { course_id, date, records } = req.body;

    if (!course_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'course_id, date, and records array are required' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check for approved OD applications for this date
    const odApplications = await ODApplication.findAll({
      where: {
        status: 'approved',
        start_date: { [Op.lte]: date },
        end_date: { [Op.gte]: date }
      },
      attributes: ['student_id']
    });
    const odStudentIds = new Set(odApplications.map(od => String(od.student_id)));

    let marked = 0;
    for (const rec of records) {
      const studentId = parseInt(rec.student_id, 10);
      if (!studentId || !Array.isArray(rec.hourly_status)) continue;

      // OD override: approved OD = present for all hours
      const finalHourly = odStudentIds.has(String(studentId))
        ? rec.hourly_status.map(() => 'present')
        : rec.hourly_status.map(h => (h === 'present' ? 'present' : 'absent'));

      const status = finalHourly.some(h => h === 'present') ? 'present' : 'absent';

      const [existing, created] = await Attendance.findOrCreate({
        where: { student_id: studentId, course_id, date },
        defaults: {
          student_id: studentId,
          course_id,
          date,
          status,
          hourly_status: finalHourly,
          marked_by: req.user.id,
          marked_at: new Date()
        }
      });

      if (!created) {
        await existing.update({
          status,
          hourly_status: finalHourly,
          marked_by: req.user.id
        });
      }
      marked++;
    }

    res.json({ success: true, message: `Attendance marked for ${marked} students` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance report for course + date
// @route   GET /api/attendance/report?course_id=X&date=Y
exports.getAttendanceReport = async (req, res) => {
  try {
    const { course_id, date } = req.query;

    if (!course_id || !date) {
      return res.status(400).json({ success: false, error: 'course_id and date query params are required' });
    }

    const records = await Attendance.findAll({
      where: { course_id, date },
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: User, as: 'marker', attributes: ['name'] }
      ],
      order: [['student_id', 'ASC']]
    });

    const course = await Course.findByPk(course_id, {
      include: [{
        model: CourseBatchTeacher, as: 'courseBatches',
        include: [{ model: Batch, as: 'batch', attributes: ['name'] }]
      }]
    });

    // Get timetable for context
    let timetable = null;
    if (course && course.courseBatches && course.courseBatches.length > 0) {
      const batchId = course.courseBatches[0].batch_id;
      const tt = await Timetable.findOne({
        where: { batch_id: batchId },
        include: [{ model: TimetableSlot, as: 'slots' }]
      });
      if (tt) {
        // Transform to day-based structure
        const timetableData = tt.toJSON();
        timetableData._id = timetableData.id;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        timetableData.timetable = {};
        days.forEach(day => {
          timetableData.timetable[day] = timetableData.slots
            .filter(s => s.day === day)
            .sort((a, b) => a.hour - b.hour)
            .map(s => ({ hour: s.hour, subject: s.subject, faculty: s.faculty, room: s.room }));
        });
        delete timetableData.slots;
        timetable = timetableData;
      }
    }

    const formattedRecords = records.map(r => {
      const d = r.toJSON();
      d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      if (d.marker) { d.marked_by = { _id: d.marked_by, name: d.marker.name }; delete d.marker; }
      return d;
    });

    const courseData = course ? { ...course.toJSON(), _id: course.id } : null;

    res.json({
      success: true,
      data: {
        records: formattedRecords,
        course: courseData,
        date,
        timetable
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history?course_id=X&date=Y   (for teacher mark-attendance grid)
// @route   GET /api/attendance/history?student_id=X          (for a student's history)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { course_id, date, student_id } = req.query;

    // Case 1: course + date → return batch students with existing attendance merged in
    if (course_id && date) {
      const cbt = await CourseBatchTeacher.findOne({
        where: { course_id },
        attributes: ['batch_id']
      });
      if (!cbt) {
        return res.json({ success: true, data: [] });
      }

      const students = await User.findAll({
        where: { batch_id: cbt.batch_id, role: 'student' },
        attributes: ['id', 'name', 'email'],
        order: [['name', 'ASC']]
      });

      const existing = await Attendance.findAll({
        where: {
          course_id,
          date,
          student_id: { [Op.in]: students.map(s => s.id) }
        }
      });
      const attMap = new Map(existing.map(r => [r.student_id, r]));

      const data = students.map(s => {
        const rec = attMap.get(s.id);
        return {
          _id: s.id,
          student_id: s.id,
          name: s.name,
          email: s.email,
          hourly_status: rec ? rec.hourly_status : Array(7).fill('absent'),
          status: rec ? rec.status : 'absent'
        };
      });

      return res.json({ success: true, data });
    }

    // Case 2: student_id → return that student's full history
    if (student_id) {
      const records = await Attendance.findAll({
        where: { student_id },
        include: [
          { model: Course, as: 'course', attributes: ['name', 'code'] },
          { model: User, as: 'marker', attributes: ['name'] }
        ],
        order: [['date', 'DESC']]
      });

      const formatted = records.map(r => {
        const d = r.toJSON();
        d._id = d.id;
        if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
        if (d.marker) { d.marked_by = { _id: d.marked_by, name: d.marker.name }; delete d.marker; }
        return d;
      });

      return res.json({ success: true, data: formatted });
    }

    return res.status(400).json({ success: false, error: 'Provide either (course_id & date) or student_id' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Edit single attendance record
// @route   PUT /api/attendance/:id
exports.editAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    const { hourly_status, status } = req.body;

    const updateData = {};
    if (hourly_status) {
      updateData.hourly_status = hourly_status;
      updateData.status = hourly_status.some(h => h === 'P') ? 'present' : 'absent';
    }
    if (status) {
      updateData.status = status;
    }

    await record.update(updateData);

    const populated = await Attendance.findByPk(record.id, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ]
    });

    const data = populated.toJSON();
    data._id = data.id;
    if (data.student) { data.student_id = { _id: data.student_id, name: data.student.name, email: data.student.email }; delete data.student; }
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }

    res.json({ success: true, data, message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
