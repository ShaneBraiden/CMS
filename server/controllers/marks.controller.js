const { Marks, Course, CourseBatchTeacher, User } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/helpers');

// @desc    Get marks (role-filtered)
// @route   GET /api/marks
exports.getMarks = async (req, res) => {
  try {
    const { role } = req.user;
    const userId = req.user.id;
    let whereClause = {};

    if (role === 'student') {
      whereClause = { student_id: userId };
    } else if (role === 'teacher') {
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { teacher_id: userId }, attributes: ['course_id'] });
      whereClause = { course_id: { [Op.in]: cbtRecords.map(r => r.course_id) } };
    }

    const marks = await Marks.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['updated_at', 'DESC']]
    });

    const formatted = marks.map(m => {
      const d = m.toJSON(); d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get specific student's marks
// @route   GET /api/marks/:student_id
exports.getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.findAll({
      where: { student_id: req.params.student_id },
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['updated_at', 'DESC']]
    });

    const formatted = marks.map(m => {
      const d = m.toJSON(); d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      if (d.course) { d.course_id = { _id: d.course_id, name: d.course.name, code: d.course.code }; delete d.course; }
      return d;
    });

    res.json({ success: true, data: formatted });
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
      student_id, course_id, exam_type,
      marks, max_marks: max_marks || 100, date, remarks
    });

    const course = await Course.findByPk(course_id);
    await createNotification(
      student_id,
      `Marks added: ${marks}/${max_marks || 100} in ${course ? course.name : 'a course'} (${exam_type || 'Exam'})`,
      'grade',
      newMarks.id
    );

    const populated = await Marks.findByPk(newMarks.id, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ]
    });

    const data = populated.toJSON(); data._id = data.id;
    if (data.student) { data.student_id = { _id: data.student_id, name: data.student.name, email: data.student.email }; delete data.student; }
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }

    res.status(201).json({ success: true, data, message: 'Marks added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update marks
// @route   PUT /api/marks/:id
exports.updateMarks = async (req, res) => {
  try {
    const mark = await Marks.findByPk(req.params.id);
    if (!mark) {
      return res.status(404).json({ success: false, error: 'Marks record not found' });
    }

    const { exam_type, marks, max_marks, date, remarks } = req.body;
    const updateData = {};
    if (exam_type !== undefined) updateData.exam_type = exam_type;
    if (marks !== undefined) updateData.marks = marks;
    if (max_marks !== undefined) updateData.max_marks = max_marks;
    if (date) updateData.date = date;
    if (remarks !== undefined) updateData.remarks = remarks;

    await mark.update(updateData);

    const populated = await Marks.findByPk(mark.id, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ]
    });

    const data = populated.toJSON(); data._id = data.id;
    if (data.student) { data.student_id = { _id: data.student_id, name: data.student.name, email: data.student.email }; delete data.student; }
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }

    res.json({ success: true, data, message: 'Marks updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete marks
// @route   DELETE /api/marks/:id
exports.deleteMarks = async (req, res) => {
  try {
    const mark = await Marks.findByPk(req.params.id);
    if (!mark) {
      return res.status(404).json({ success: false, error: 'Marks record not found' });
    }
    await mark.destroy();
    res.json({ success: true, message: 'Marks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
