const Marks = require('../models/Marks');
const Course = require('../models/Course');
const { createNotification } = require('../utils/helpers');

// @desc    Get marks (role-filtered)
// @route   GET /api/marks
exports.getMarks = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = {};

    if (role === 'student') {
      query = { student_id: _id };
    } else if (role === 'teacher') {
      const courses = await Course.find({ teacher_id: _id });
      query = { course_id: { $in: courses.map(c => c._id) } };
    }

    const marks = await Marks.find(query)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code')
      .sort({ updated_at: -1 });

    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get specific student's marks
// @route   GET /api/marks/:student_id
exports.getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student_id: req.params.student_id })
      .populate('student_id', 'name email')
      .populate('course_id', 'name code')
      .sort({ updated_at: -1 });

    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add marks
// @route   POST /api/marks
exports.addMarks = async (req, res) => {
  try {
    const { student_id, course_id, exam_type, marks, max_marks, date, remarks } = req.body;

    if (!student_id || !course_id || marks === undefined) {
      return res.status(400).json({ success: false, error: 'Student, course, and marks are required' });
    }

    const newMarks = await Marks.create({
      student_id,
      course_id,
      exam_type,
      marks,
      max_marks: max_marks || 100,
      date,
      remarks
    });

    // Notify student
    const course = await Course.findById(course_id);
    await createNotification(
      student_id,
      `Marks added: ${marks}/${max_marks || 100} in ${course ? course.name : 'a course'} (${exam_type || 'Exam'})`,
      'grade',
      newMarks._id
    );

    const populated = await Marks.findById(newMarks._id)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code');

    res.status(201).json({ success: true, data: populated, message: 'Marks added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update marks
// @route   PUT /api/marks/:id
exports.updateMarks = async (req, res) => {
  try {
    const mark = await Marks.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({ success: false, error: 'Marks record not found' });
    }

    const { exam_type, marks, max_marks, date, remarks } = req.body;
    if (exam_type !== undefined) mark.exam_type = exam_type;
    if (marks !== undefined) mark.marks = marks;
    if (max_marks !== undefined) mark.max_marks = max_marks;
    if (date) mark.date = date;
    if (remarks !== undefined) mark.remarks = remarks;
    mark.updated_at = Date.now();

    await mark.save();

    const populated = await Marks.findById(mark._id)
      .populate('student_id', 'name email')
      .populate('course_id', 'name code');

    res.json({ success: true, data: populated, message: 'Marks updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete marks
// @route   DELETE /api/marks/:id
exports.deleteMarks = async (req, res) => {
  try {
    const mark = await Marks.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({ success: false, error: 'Marks record not found' });
    }

    await Marks.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Marks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
