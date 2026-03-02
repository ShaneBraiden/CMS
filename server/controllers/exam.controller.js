const Exam = require('../models/Exam');
const Course = require('../models/Course');

// @desc    Get exams
// @route   GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('course_id', 'name code')
      .populate('created_by', 'name')
      .sort({ exam_date: 1 });

    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create exam
// @route   POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const { course_id, exam_date, start_time, duration, venue, exam_type } = req.body;

    if (!course_id || !exam_date) {
      return res.status(400).json({ success: false, error: 'Course and exam date are required' });
    }

    const exam = await Exam.create({
      course_id,
      exam_date,
      start_time,
      duration,
      venue,
      exam_type,
      created_by: req.user._id
    });

    const populated = await Exam.findById(exam._id)
      .populate('course_id', 'name code')
      .populate('created_by', 'name');

    res.status(201).json({ success: true, data: populated, message: 'Exam scheduled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    const fields = ['course_id', 'exam_date', 'start_time', 'duration', 'venue', 'exam_type'];
    fields.forEach(f => { if (req.body[f] !== undefined) exam[f] = req.body[f]; });
    await exam.save();

    const populated = await Exam.findById(exam._id)
      .populate('course_id', 'name code')
      .populate('created_by', 'name');

    res.json({ success: true, data: populated, message: 'Exam updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
