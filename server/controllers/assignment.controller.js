const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const User = require('../models/User');
const { createBulkNotifications } = require('../utils/helpers');

// @desc    Get assignments (role-filtered)
// @route   GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const { role, _id, batch_id } = req.user;
    let query = {};

    if (role === 'teacher') {
      query = { teacher_id: _id };
    } else if (role === 'student') {
      const courses = await Course.find({ batch_id });
      query = { course_id: { $in: courses.map(c => c._id) } };
    }

    const assignments = await Assignment.find(query)
      .populate('course_id', 'name code')
      .populate('teacher_id', 'name')
      .sort({ created_at: -1 });

    // For students: add submission status
    if (role === 'student') {
      const submissions = await Submission.find({ student_id: _id });
      const submittedMap = {};
      submissions.forEach(s => { submittedMap[s.assignment_id.toString()] = s; });

      const enriched = assignments.map(a => ({
        ...a.toObject(),
        submitted: !!submittedMap[a._id.toString()],
        submission: submittedMap[a._id.toString()] || null
      }));
      return res.json({ success: true, data: enriched });
    }

    // For teachers: add submission count
    if (role === 'teacher' || role === 'admin') {
      const enriched = await Promise.all(assignments.map(async (a) => {
        const count = await Submission.countDocuments({ assignment_id: a._id });
        return { ...a.toObject(), submissionCount: count };
      }));
      return res.json({ success: true, data: enriched });
    }

    res.json({ success: true, data: assignments });
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

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course_id,
      teacher_id: req.user._id,
      due_date,
      total_marks
    });

    // Notify students in the course's batch
    if (course.batch_id) {
      const students = await User.find({ batch_id: course.batch_id, role: 'student' });
      const studentIds = students.map(s => s._id);
      await createBulkNotifications(
        studentIds,
        `New assignment: "${title}" in ${course.name}`,
        'assignment',
        assignment._id
      );
    }

    const populated = await Assignment.findById(assignment._id)
      .populate('course_id', 'name code')
      .populate('teacher_id', 'name');

    res.status(201).json({ success: true, data: populated, message: 'Assignment created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const { title, description, course_id, due_date, total_marks } = req.body;
    if (title) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (course_id) assignment.course_id = course_id;
    if (due_date) assignment.due_date = due_date;
    if (total_marks !== undefined) assignment.total_marks = total_marks;

    await assignment.save();

    const populated = await Assignment.findById(assignment._id)
      .populate('course_id', 'name code')
      .populate('teacher_id', 'name');

    res.json({ success: true, data: populated, message: 'Assignment updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    await Submission.deleteMany({ assignment_id: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
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

    const submission = await Submission.findOneAndUpdate(
      { assignment_id: assignment._id, student_id: req.user._id },
      { $set: submissionData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: submission, message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:id/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment_id: req.params.id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
