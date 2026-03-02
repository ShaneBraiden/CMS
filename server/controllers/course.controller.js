const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');

// @desc    Get courses (role-filtered)
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    let query = {};
    const { role, _id, batch_id } = req.user;

    if (role === 'teacher') {
      query = { 'batches.teacher_id': _id };
    } else if (role === 'student') {
      query = { 'batches.batch_id': batch_id };
    }
    // admin sees all

    // Optional filters via query params
    const { semester, year, department } = req.query;
    if (semester) query.semester = Number(semester);
    if (year) query.year = Number(year);
    if (department) query.department = department;

    const courses = await Course.find(query)
      .populate('batches.teacher_id', 'name email')
      .populate('batches.batch_id', 'name year department')
      .sort({ semester: 1, name: 1, created_at: -1 });

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, credits, department, semester, year, regulation, batches } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Course name is required' });
    }

    // batches should be an array of { batch_id, teacher_id }
    const course = await Course.create({
      name,
      code,
      description,
      credits,
      department,
      semester: semester || null,
      year: year || null,
      regulation: regulation || '',
      batches: batches || []
    });

    const populated = await Course.findById(course._id)
      .populate('batches.teacher_id', 'name email')
      .populate('batches.batch_id', 'name year department');

    res.status(201).json({ success: true, data: populated, message: 'Course created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const { name, code, description, credits, department, semester, year, regulation, batches } = req.body;

    if (name) course.name = name;
    if (code) course.code = code;
    if (description !== undefined) course.description = description;
    if (credits !== undefined) course.credits = credits;
    if (department !== undefined) course.department = department;
    if (semester !== undefined) course.semester = semester;
    if (year !== undefined) course.year = year;
    if (regulation !== undefined) course.regulation = regulation;
    if (batches !== undefined) course.batches = batches;

    await course.save();

    const populated = await Course.findById(course._id)
      .populate('batches.teacher_id', 'name email')
      .populate('batches.batch_id', 'name year department');

    res.json({ success: true, data: populated, message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Remove related data
    const courseId = course._id;
    await Promise.all([
      Assignment.deleteMany({ course_id: courseId }),
      Submission.deleteMany({ assignment_id: { $in: (await Assignment.find({ course_id: courseId })).map(a => a._id) } }),
      Marks.deleteMany({ course_id: courseId }),
      Attendance.deleteMany({ course_id: courseId }),
      Exam.deleteMany({ course_id: courseId })
    ]);

    await Course.findByIdAndDelete(courseId);

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
