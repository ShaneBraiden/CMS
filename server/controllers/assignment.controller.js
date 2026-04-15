const { Assignment, Submission, Course, User, CourseBatchTeacher } = require('../models');
const { Op } = require('sequelize');
const { createBulkNotifications } = require('../utils/helpers');

// @desc    Get assignments (role-filtered)
// @route   GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const { role, batch_id } = req.user;
    const userId = req.user.id;
    let whereClause = {};

    if (role === 'teacher') {
      whereClause = { teacher_id: userId };
    } else if (role === 'student') {
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { batch_id }, attributes: ['course_id'] });
      const courseIds = cbtRecords.map(r => r.course_id);
      whereClause = { course_id: { [Op.in]: courseIds } };
    }

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'teacher', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // For students: add submission status
    if (role === 'student') {
      const submissions = await Submission.findAll({ where: { student_id: userId } });
      const submittedMap = {};
      submissions.forEach(s => { submittedMap[s.assignment_id] = s; });

      const enriched = assignments.map(a => {
        const data = a.toJSON();
        data._id = data.id;
        if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
        if (data.teacher) { data.teacher_id = { _id: data.teacher_id, name: data.teacher.name }; delete data.teacher; }
        data.submitted = !!submittedMap[a.id];
        data.submission = submittedMap[a.id] ? { ...submittedMap[a.id].toJSON(), _id: submittedMap[a.id].id } : null;
        return data;
      });
      return res.json({ success: true, data: enriched });
    }

    // For teachers: add submission count
    if (role === 'teacher' || role === 'admin') {
      const enriched = await Promise.all(assignments.map(async (a) => {
        const count = await Submission.count({ where: { assignment_id: a.id } });
        const data = a.toJSON();
        data._id = data.id;
        if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
        if (data.teacher) { data.teacher_id = { _id: data.teacher_id, name: data.teacher.name }; delete data.teacher; }
        data.submissionCount = count;
        return data;
      }));
      return res.json({ success: true, data: enriched });
    }

    const formatted = assignments.map(a => { const d = a.toJSON(); d._id = d.id; return d; });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create assignment
// @route   POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, course_id, due_date, total_marks } = req.body;

    if (!title || !course_id) {
      return res.status(400).json({ success: false, error: 'Title and course are required' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course_id,
      teacher_id: req.user.id,
      due_date,
      total_marks
    });

    // Notify students in the course's batches
    const cbtRecords = await CourseBatchTeacher.findAll({ where: { course_id }, attributes: ['batch_id'] });
    const batchIds = cbtRecords.map(r => r.batch_id);
    if (batchIds.length > 0) {
      const students = await User.findAll({ where: { batch_id: { [Op.in]: batchIds }, role: 'student' }, attributes: ['id'] });
      const studentIds = students.map(s => s.id);
      await createBulkNotifications(
        studentIds,
        `New assignment: "${title}" in ${course.name}`,
        'assignment',
        assignment.id
      );
    }

    const populated = await Assignment.findByPk(assignment.id, {
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'teacher', attributes: ['name'] }
      ]
    });

    const data = populated.toJSON();
    data._id = data.id;
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
    if (data.teacher) { data.teacher_id = { _id: data.teacher_id, name: data.teacher.name }; delete data.teacher; }

    res.status(201).json({ success: true, data, message: 'Assignment created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const { title, description, course_id, due_date, total_marks } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (course_id) updateData.course_id = course_id;
    if (due_date) updateData.due_date = due_date;
    if (total_marks !== undefined) updateData.total_marks = total_marks;

    await assignment.update(updateData);

    const populated = await Assignment.findByPk(assignment.id, {
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: User, as: 'teacher', attributes: ['name'] }
      ]
    });

    const data = populated.toJSON();
    data._id = data.id;
    if (data.course) { data.course_id = { _id: data.course_id, name: data.course.name, code: data.course.code }; delete data.course; }
    if (data.teacher) { data.teacher_id = { _id: data.teacher_id, name: data.teacher.name }; delete data.teacher; }

    res.json({ success: true, data, message: 'Assignment updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // CASCADE handles Submission deletion
    await assignment.destroy();

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const file = req.file;
    const { comments } = req.body;

    // Upsert: update if exists, create if not
    const submissionData = {
      student_name: req.user.name,
      comments: comments || '',
      submitted_at: new Date(),
      status: 'submitted'
    };

    if (file) {
      submissionData.file_path = file.path;
      submissionData.filename = file.originalname;
    }

    let submission = await Submission.findOne({
      where: { assignment_id: assignment.id, student_id: req.user.id }
    });

    if (submission) {
      await submission.update(submissionData);
    } else {
      submission = await Submission.create({
        assignment_id: assignment.id,
        student_id: req.user.id,
        ...submissionData
      });
    }

    const data = submission.toJSON();
    data._id = data.id;
    res.json({ success: true, data, message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:id/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { assignment_id: req.params.id },
      include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
      order: [['submitted_at', 'DESC']]
    });

    const formatted = submissions.map(s => {
      const data = s.toJSON();
      data._id = data.id;
      if (data.student) { data.student_id = { _id: data.student_id, name: data.student.name, email: data.student.email }; delete data.student; }
      return data;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
