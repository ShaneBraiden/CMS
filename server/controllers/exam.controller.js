const { Exam, Course, User } = require('../models');

// @desc    Get exams
// @route   GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [['exam_date', 'ASC']]
    });

    const formatted = exams.map(e => {
      const d = e.toJSON(); d._id = d.id;
      if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
      if (d.creator) { d.created_by = { _id: d.created_by, name: d.creator.name }; delete d.creator; }
      return d;
    });

    res.json({ success: true, data: formatted });
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

    const exam = await Exam.create({ course_id, exam_date, start_time, duration, venue, exam_type, created_by: req.user.id });

    const populated = await Exam.findByPk(exam.id, {
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const data = populated.toJSON(); data._id = data.id;
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
    if (data.creator) { data.created_by = { _id: data.created_by, name: data.creator.name }; delete data.creator; }

    res.status(201).json({ success: true, data, message: 'Exam scheduled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    const fields = ['course_id', 'exam_date', 'start_time', 'duration', 'venue', 'exam_type'];
    const updateData = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
    await exam.update(updateData);

    const populated = await Exam.findByPk(exam.id, {
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const data = populated.toJSON(); data._id = data.id;
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
    if (data.creator) { data.created_by = { _id: data.created_by, name: data.creator.name }; delete data.creator; }

    res.json({ success: true, data, message: 'Exam updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    await exam.destroy();
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
