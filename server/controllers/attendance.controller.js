const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const ODApplication = require('../models/ODApplication');
const Timetable = require('../models/Timetable');

// @desc    Get attendance (role-filtered)
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { role, _id, batch_id } = req.user;

    if (role === 'student') {
      // Get attendance grouped by course with percentage
      const courses = await Course.find({ batch_id });
      const courseData = await Promise.all(courses.map(async (course) => {
        const records = await Attendance.find({ student_id: _id, course_id: course._id });
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return {
          course: { _id: course._id, name: course.name, code: course.code },
          total,
          present,
          absent: total - present,
          percentage
        };
      }));
      return res.json({ success: true, data: courseData });
    }

    if (role === 'teacher') {
      // Return courses the teacher teaches
      const courses = await Course.find({ teacher_id: _id })
        .populate('batch_id', 'name');
      return res.json({ success: true, data: courses });
    }

    // Admin: return all courses
    const courses = await Course.find()
      .populate('teacher_id', 'name')
      .populate('batch_id', 'name');
    return res.json({ success: true, data: courses });
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

    let query = { course_id };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const records = await Attendance.find(query)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code')
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark attendance (bulk, with hourly_status merging)
// @route   POST /api/attendance/mark/:course_id
exports.markAttendance = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { date, selected_hours, attendance } = req.body;

    if (!date || !selected_hours || !attendance) {
      return res.status(400).json({ success: false, error: 'Date, selected hours, and attendance data are required' });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check for approved OD applications for this date
    const odApplications = await ODApplication.find({
      status: 'approved',
      start_date: { $lte: attendanceDate },
      end_date: { $gte: attendanceDate }
    });
    const odStudentIds = new Set(odApplications.map(od => od.student_id.toString()));

    const bulkOps = [];
    const studentIds = Object.keys(attendance);

    for (const studentId of studentIds) {
      const studentAttendance = attendance[studentId];

      // Check if record already exists
      const existing = await Attendance.findOne({
        student_id: studentId,
        course_id,
        date: attendanceDate
      });

      if (existing) {
        // MERGE: only update selected hours
        const merged = [...existing.hourly_status];
        for (const hour of selected_hours) {
          const hourIndex = hour - 1;
          if (odStudentIds.has(studentId)) {
            merged[hourIndex] = 'P'; // OD students auto-marked present
          } else {
            merged[hourIndex] = studentAttendance[String(hour)] || 'A';
          }
        }
        const status = merged.some(h => h === 'P') ? 'present' : 'absent';

        bulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: {
              $set: {
                hourly_status: merged,
                status,
                marked_by: req.user._id,
                updated_at: new Date()
              }
            }
          }
        });
      } else {
        // CREATE new record
        const hourly_status = ['N', 'N', 'N', 'N', 'N', 'N', 'N'];
        for (const hour of selected_hours) {
          const hourIndex = hour - 1;
          if (odStudentIds.has(studentId)) {
            hourly_status[hourIndex] = 'P';
          } else {
            hourly_status[hourIndex] = studentAttendance[String(hour)] || 'A';
          }
        }
        const status = hourly_status.some(h => h === 'P') ? 'present' : 'absent';

        bulkOps.push({
          insertOne: {
            document: {
              student_id: studentId,
              course_id,
              date: attendanceDate,
              status,
              hourly_status,
              marked_by: req.user._id,
              marked_at: new Date(),
              updated_at: new Date()
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: `Attendance marked for ${studentIds.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance report for course + date
// @route   GET /api/attendance/report/:course_id/:date
exports.getAttendanceReport = async (req, res) => {
  try {
    const { course_id, date } = req.params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      course_id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('student_id', 'name email')
      .populate('marked_by', 'name')
      .sort({ 'student_id.name': 1 });

    const course = await Course.findById(course_id).populate('batch_id', 'name');

    // Get timetable for context
    let timetable = null;
    if (course && course.batch_id) {
      timetable = await Timetable.findOne({ batch_id: course.batch_id._id || course.batch_id });
    }

    res.json({
      success: true,
      data: {
        records,
        course,
        date: startOfDay,
        timetable
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student's attendance history
// @route   GET /api/attendance/history/:student_id
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { student_id } = req.params;

    const records = await Attendance.find({ student_id })
      .populate('course_id', 'name code')
      .populate('marked_by', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Edit single attendance record
// @route   PUT /api/attendance/:id
exports.editAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    const { hourly_status, status } = req.body;

    if (hourly_status) {
      record.hourly_status = hourly_status;
      record.status = hourly_status.some(h => h === 'P') ? 'present' : 'absent';
    }
    if (status) {
      record.status = status;
    }

    record.updated_at = new Date();
    await record.save();

    const populated = await Attendance.findById(record._id)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code');

    res.json({ success: true, data: populated, message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
