const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');

// ═══════════ USERS ═══════════

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query)
      .select('-password_hash')
      .populate('batch_id', 'name')
      .sort({ created_at: -1 });

    res.json({ success: true, data: users });
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

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password,
      role
    });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
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
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
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

    // Build all candidate emails in one pass
    const candidateEmails = [];
    const candidateUsers = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(digitLength, '0');
      const email = `${start.prefix}${numStr}${start.suffix}`;
      const name = `${start.prefix.toUpperCase()}${numStr}`;
      candidateEmails.push(email);
      candidateUsers.push({ email, name });
    }

    // Single query to find all existing emails
    const existingUsers = await User.find({ email: { $in: candidateEmails } }).select('email').lean();
    const existingSet = new Set(existingUsers.map(u => u.email));

    const skipped = [];
    const toInsert = [];
    for (const candidate of candidateUsers) {
      if (existingSet.has(candidate.email)) {
        skipped.push(candidate.email);
      } else {
        const userData = {
          name: candidate.name,
          email: candidate.email,
          password_hash: defaultPassword,
          role: userRole,
        };
        if (batch_id) userData.batch_id = batch_id;
        toInsert.push(userData);
      }
    }

    // Bulk insert all new users at once
    let created = [];
    if (toInsert.length > 0) {
      const inserted = await User.insertMany(toInsert, { ordered: false });
      created = inserted.map(u => ({ _id: u._id, name: u.name, email: u.email }));
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
    // Use aggregation to avoid N+1 query for student counts
    const batchData = await Batch.aggregate([
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'teacher_id',
          foreignField: '_id',
          as: 'teacher',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { batchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$batch_id', '$$batchId'] }, { $eq: ['$role', 'student'] }] } } },
            { $count: 'count' }
          ],
          as: 'studentCountArr'
        }
      },
      {
        $addFields: {
          teacher_id: { $arrayElemAt: ['$teacher', 0] },
          studentCount: { $ifNull: [{ $arrayElemAt: ['$studentCountArr.count', 0] }, 0] }
        }
      },
      { $project: { teacher: 0, studentCountArr: 0 } }
    ]);

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

    const batchData = {
      name,
      year: year || '',
      department: department || '',
      teacher_id: teacher_id && teacher_id !== '' ? teacher_id : null
    };
    const batch = await Batch.create(batchData);
    res.status(201).json({ success: true, data: batch, message: 'Batch created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update batch
// @route   PUT /api/admin/batches/:id
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const { name, year, department, teacher_id } = req.body;
    if (name) batch.name = name;
    if (year !== undefined) batch.year = year || '';
    if (department !== undefined) batch.department = department || '';
    if (teacher_id !== undefined) batch.teacher_id = teacher_id && teacher_id !== '' ? teacher_id : null;

    await batch.save();
    res.json({ success: true, data: batch, message: 'Batch updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/admin/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Remove batch assignment from students
    await User.updateMany({ batch_id: batch._id }, { $set: { batch_id: null } });
    await Batch.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get students in a batch
// @route   GET /api/admin/batches/:id/students
exports.getBatchStudents = async (req, res) => {
  try {
    const students = await User.find({ batch_id: req.params.id, role: 'student' })
      .select('-password_hash')
      .sort({ name: 1 });

    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Manage batch students (add/remove)
// @route   POST /api/admin/batches/:id/students
exports.manageBatchStudents = async (req, res) => {
  try {
    const { add, remove } = req.body;
    const mongoose = require('mongoose');
    const batchId = new mongoose.Types.ObjectId(req.params.id);

    if (add && add.length > 0) {
      await User.updateMany(
        { _id: { $in: add } },
        { $set: { batch_id: batchId } }
      );
    }

    if (remove && remove.length > 0) {
      await User.updateMany(
        { _id: { $in: remove } },
        { $set: { batch_id: null } }
      );
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
    const mongoose = require('mongoose');
    const batchId = new mongoose.Types.ObjectId(req.params.id);

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

    // Build all candidate emails
    const emails = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(digitLength, '0');
      emails.push(`${start.prefix}${numStr}${start.suffix}`);
    }

    // Find matching students and assign them
    const result = await User.updateMany(
      { email: { $in: emails }, role: 'student' },
      { $set: { batch_id: batchId } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} student(s) assigned to batch`,
      data: { matched: result.matchedCount, assigned: result.modifiedCount, totalRange: emails.length }
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
      Batch.find().sort({ name: 1 }),
      Timetable.find().populate('batch_id', 'name'),
      Course.find().populate('teacher_id', 'name').populate('batch_id', 'name')
    ]);

    res.json({ success: true, data: { batches, timetables, courses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ═══════════ ADMIN ATTENDANCE REPORTS ═══════════

// @desc    Attendance reports overview
// @route   GET /api/admin/attendance/reports
exports.getAttendanceReports = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher_id', 'name')
      .populate('batch_id', 'name');

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attendance by course
// @route   GET /api/admin/attendance/by-course
exports.getAttendanceByCourse = async (req, res) => {
  try {
    const { course_id } = req.query;
    let matchStage = {};
    if (course_id) matchStage = { course_id: new (require('mongoose').Types.ObjectId)(course_id) };

    const data = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$course_id',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses', localField: '_id', foreignField: '_id', as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          course_name: '$course.name',
          total: 1,
          present: 1,
          percentage: {
            $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }, 0]
          }
        }
      }
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Attendance by date
// @route   GET /api/admin/attendance/by-date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    let matchStage = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      matchStage = { date: { $gte: start, $lte: end } };
    }

    const data = await Attendance.find(matchStage)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code')
      .sort({ date: -1 });

    res.json({ success: true, data });
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
      const records = await Attendance.find({ student_id })
        .populate('course_id', 'name code')
        .sort({ date: -1 });
      return res.json({ success: true, data: records });
    }

    // Return students list with attendance summary (aggregation instead of N+1)
    const studentData = await Attendance.aggregate([
      {
        $group: {
          _id: '$student_id',
          totalClasses: { $sum: 1 },
          presentClasses: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
          pipeline: [{ $match: { role: 'student' } }, { $project: { name: 1, email: 1, batch_id: 1 } }]
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: '$student._id',
          name: '$student.name',
          email: '$student.email',
          batch_id: '$student.batch_id',
          totalClasses: 1,
          presentClasses: 1,
          percentage: {
            $cond: [
              { $gt: ['$totalClasses', 0] },
              { $round: [{ $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] }, 0] },
              0
            ]
          }
        }
      }
    ]);

    res.json({ success: true, data: studentData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
