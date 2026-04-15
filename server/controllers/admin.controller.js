const { User, Batch, Course, Timetable, TimetableSlot, Attendance, CourseBatchTeacher } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcryptjs');

// ═══════════ USERS ═══════════

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = role ? { role } : {};
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Batch, as: 'batch', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    const formatted = users.map(u => {
      const d = u.toJSON(); d._id = d.id;
      if (d.batch) { d.batch_id = { _id: d.batch_id, name: d.batch.name }; delete d.batch; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create user
// @route   POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password_hash: password, role });

    res.status(201).json({
      success: true,
      data: { _id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk create users from email range
// @route   POST /api/admin/users/bulk
exports.bulkCreateUsers = async (req, res) => {
  try {
    const { startEmail, endEmail, role, password, batch_id } = req.body;

    if (!startEmail || !endEmail) {
      return res.status(400).json({ success: false, error: 'Start and end emails are required' });
    }

    const parseEmail = (email) => {
      const match = email.match(/^([a-zA-Z]*)(\d+)(@.+)$/);
      if (!match) return null;
      return { prefix: match[1], number: match[2], suffix: match[3] };
    };

    const start = parseEmail(startEmail.toLowerCase().trim());
    const end = parseEmail(endEmail.toLowerCase().trim());

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Invalid email format. Expected format like e0324001@sriher.edu.in' });
    }

    if (start.prefix !== end.prefix || start.suffix !== end.suffix) {
      return res.status(400).json({ success: false, error: 'Start and end emails must have the same prefix and domain' });
    }

    const startNum = parseInt(start.number, 10);
    const endNum = parseInt(end.number, 10);
    const digitLength = start.number.length;

    if (startNum > endNum) {
      return res.status(400).json({ success: false, error: 'Start number must be less than or equal to end number' });
    }

    if (endNum - startNum > 500) {
      return res.status(400).json({ success: false, error: 'Cannot create more than 500 users at once' });
    }

    const defaultPassword = password || 'sret@321';
    const userRole = role || 'student';

    // Build all candidate emails
    const candidateEmails = [];
    const candidateUsers = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(digitLength, '0');
      const email = `${start.prefix}${numStr}${start.suffix}`;
      const name = `${start.prefix.toUpperCase()}${numStr}`;
      candidateEmails.push(email);
      candidateUsers.push({ email, name });
    }

    // Find all existing emails
    const existingUsers = await User.findAll({
      where: { email: { [Op.in]: candidateEmails } },
      attributes: ['email'],
      raw: true
    });
    const existingSet = new Set(existingUsers.map(u => u.email));

    const skipped = [];
    const toInsert = [];

    // Pre-hash passwords for bulkCreate (hooks don't fire on bulkCreate by default)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    for (const candidate of candidateUsers) {
      if (existingSet.has(candidate.email)) {
        skipped.push(candidate.email);
      } else {
        const userData = {
          name: candidate.name,
          email: candidate.email,
          password_hash: hashedPassword,
          role: userRole,
        };
        if (batch_id) userData.batch_id = batch_id;
        toInsert.push(userData);
      }
    }

    // Bulk insert
    let created = [];
    if (toInsert.length > 0) {
      const inserted = await User.bulkCreate(toInsert, { hooks: false });
      created = inserted.map(u => ({ _id: u.id, name: u.name, email: u.email }));
    }

    res.status(201).json({
      success: true,
      message: `${created.length} users created, ${skipped.length} skipped (already exist)`,
      data: { created: created.length, skipped: skipped.length, skippedEmails: skipped }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════ BATCHES ═══════════

// @desc    Get all batches
// @route   GET /api/admin/batches
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      include: [{ model: User, as: 'teacher', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    // Get student counts per batch
    const batchData = await Promise.all(batches.map(async (batch) => {
      const studentCount = await User.count({ where: { batch_id: batch.id, role: 'student' } });
      const d = batch.toJSON();
      d._id = d.id;
      d.studentCount = studentCount;
      if (d.teacher) {
        d.teacher_id = { _id: d.teacher_id, name: d.teacher.name };
        delete d.teacher;
      }
      return d;
    }));

    res.json({ success: true, data: batchData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create batch
// @route   POST /api/admin/batches
exports.createBatch = async (req, res) => {
  try {
    const { name, year, department, teacher_id } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Batch name is required' });
    }

    const batch = await Batch.create({
      name,
      year: year || '',
      department: department || '',
      teacher_id: teacher_id && teacher_id !== '' ? teacher_id : null
    });
    const data = batch.toJSON(); data._id = data.id;
    res.status(201).json({ success: true, data, message: 'Batch created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update batch
// @route   PUT /api/admin/batches/:id
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const { name, year, department, teacher_id } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (year !== undefined) updateData.year = year || '';
    if (department !== undefined) updateData.department = department || '';
    if (teacher_id !== undefined) updateData.teacher_id = teacher_id && teacher_id !== '' ? teacher_id : null;

    await batch.update(updateData);
    const data = batch.toJSON(); data._id = data.id;
    res.json({ success: true, data, message: 'Batch updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/admin/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Remove batch assignment from students
    await User.update({ batch_id: null }, { where: { batch_id: batch.id } });
    await batch.destroy();

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get students in a batch
// @route   GET /api/admin/batches/:id/students
exports.getBatchStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { batch_id: req.params.id, role: 'student' },
      attributes: { exclude: ['password_hash'] },
      order: [['name', 'ASC']]
    });

    const formatted = students.map(s => { const d = s.toJSON(); d._id = d.id; return d; });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Manage batch students (add/remove)
// @route   POST /api/admin/batches/:id/students
exports.manageBatchStudents = async (req, res) => {
  try {
    const { add, remove } = req.body;
    const batchId = parseInt(req.params.id);

    if (add && add.length > 0) {
      await User.update({ batch_id: batchId }, { where: { id: { [Op.in]: add } } });
    }

    if (remove && remove.length > 0) {
      await User.update({ batch_id: null }, { where: { id: { [Op.in]: remove } } });
    }

    res.json({ success: true, message: 'Batch students updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk assign students to batch by email range
// @route   POST /api/admin/batches/:id/students/range
exports.bulkAssignByRange = async (req, res) => {
  try {
    const { startEmail, endEmail } = req.body;
    const batchId = parseInt(req.params.id);

    if (!startEmail || !endEmail) {
      return res.status(400).json({ success: false, error: 'Start and end emails are required' });
    }

    const parseEmail = (email) => {
      const match = email.match(/^([a-zA-Z]*)(\d+)(@.+)$/);
      if (!match) return null;
      return { prefix: match[1], number: match[2], suffix: match[3] };
    };

    const start = parseEmail(startEmail.toLowerCase().trim());
    const end = parseEmail(endEmail.toLowerCase().trim());

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Invalid email format. Expected format like e0324001@sriher.edu.in' });
    }

    if (start.prefix !== end.prefix || start.suffix !== end.suffix) {
      return res.status(400).json({ success: false, error: 'Start and end emails must have the same prefix and domain' });
    }

    const startNum = parseInt(start.number, 10);
    const endNum = parseInt(end.number, 10);
    const digitLength = start.number.length;

    if (startNum > endNum) {
      return res.status(400).json({ success: false, error: 'Start email number must be less than or equal to end' });
    }

    const emails = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(digitLength, '0');
      emails.push(`${start.prefix}${numStr}${start.suffix}`);
    }

    const [affectedCount] = await User.update(
      { batch_id: batchId },
      { where: { email: { [Op.in]: emails }, role: 'student' } }
    );

    res.json({
      success: true,
      message: `${affectedCount} student(s) assigned to batch`,
      data: { matched: affectedCount, assigned: affectedCount, totalRange: emails.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════ ADMIN TIMETABLES ═══════════

// @desc    Get timetable management data
// @route   GET /api/admin/timetables
exports.getAdminTimetables = async (req, res) => {
  try {
    const [batches, timetables, courses] = await Promise.all([
      Batch.findAll({ order: [['name', 'ASC']] }),
      Timetable.findAll({
        include: [
          { model: Batch, as: 'batch', attributes: ['name'] },
          { model: TimetableSlot, as: 'slots' }
        ]
      }),
      Course.findAll({
        include: [{
          model: CourseBatchTeacher, as: 'courseBatches',
          include: [
            { model: User, as: 'teacher', attributes: ['name'] },
            { model: Batch, as: 'batch', attributes: ['name'] }
          ]
        }]
      })
    ]);

    // Format timetables with day-based structure
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const formattedTimetables = timetables.map(tt => {
      const d = tt.toJSON(); d._id = d.id;
      if (d.batch) { d.batch_id = { _id: d.batch_id, name: d.batch.name }; delete d.batch; }
      d.timetable = {};
      DAYS.forEach(day => {
        d.timetable[day] = (d.slots || [])
          .filter(s => s.day === day)
          .sort((a, b) => a.hour - b.hour)
          .map(s => ({ hour: s.hour, subject: s.subject, faculty: s.faculty, room: s.room }));
      });
      delete d.slots;
      return d;
    });

    const formattedBatches = batches.map(b => { const d = b.toJSON(); d._id = d.id; return d; });
    const formattedCourses = courses.map(c => { const d = c.toJSON(); d._id = d.id; return d; });

    res.json({ success: true, data: { batches: formattedBatches, timetables: formattedTimetables, courses: formattedCourses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════ ADMIN ATTENDANCE REPORTS ═══════════

// @desc    Attendance reports overview
// @route   GET /api/admin/attendance/reports
exports.getAttendanceReports = async (req, res) => {
  try {
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
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attendance by course
// @route   GET /api/admin/attendance/by-course
exports.getAttendanceByCourse = async (req, res) => {
  try {
    const { course_id } = req.query;
    let whereClause = {};
    if (course_id) whereClause = { course_id: parseInt(course_id) };

    const data = await Attendance.findAll({
      where: whereClause,
      attributes: [
        'course_id',
        [fn('COUNT', col('Attendance.id')), 'total'],
        [fn('SUM', literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
      ],
      include: [{ model: Course, as: 'course', attributes: ['name'] }],
      group: ['course_id', 'course.id'],
      raw: true,
      nest: true
    });

    const formatted = data.map(d => ({
      _id: d.course_id,
      course_name: d.course ? d.course.name : 'Unknown',
      total: parseInt(d.total),
      present: parseInt(d.present),
      percentage: parseInt(d.total) > 0 ? Math.round((parseInt(d.present) / parseInt(d.total)) * 1000) / 10 : 0
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attendance by date
// @route   GET /api/admin/attendance/by-date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    let whereClause = {};
    if (date) {
      whereClause = { date };
    }

    const data = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['date', 'DESC']]
    });

    const formatted = data.map(r => {
      const d = r.toJSON(); d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attendance by student
// @route   GET /api/admin/attendance/by-student
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { student_id } = req.query;

    if (student_id) {
      const records = await Attendance.findAll({
        where: { student_id },
        include: [{ model: Course, as: 'course', attributes: ['name', 'code'] }],
        order: [['date', 'DESC']]
      });
      const formatted = records.map(r => {
        const d = r.toJSON(); d._id = d.id;
        if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
        return d;
      });
      return res.json({ success: true, data: formatted });
    }

    // Return students list with attendance summary
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'batch_id']
    });

    const studentData = await Promise.all(students.map(async (s) => {
      const totalClasses = await Attendance.count({ where: { student_id: s.id } });
      const presentClasses = await Attendance.count({ where: { student_id: s.id, status: 'present' } });
      return {
        _id: s.id,
        name: s.name,
        email: s.email,
        batch_id: s.batch_id,
        totalClasses,
        presentClasses,
        percentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
      };
    }));

    res.json({ success: true, data: studentData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
