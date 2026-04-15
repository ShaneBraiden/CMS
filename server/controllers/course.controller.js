const { Course, CourseBatchTeacher, Assignment, Submission, Marks, Attendance, Exam, Batch, User } = require('../models');
const { Op } = require('sequelize');

// Helper: format a course with nested batches array for API compatibility
const formatCourseResponse = (course) => {
  const data = course.toJSON();
  data._id = data.id;
  if (data.courseBatches) {
    data.batches = data.courseBatches.map(cb => ({
      _id: cb.id,
      batch_id: cb.batch ? { _id: cb.batch_id, name: cb.batch.name, year: cb.batch.year, department: cb.batch.department } : cb.batch_id,
      teacher_id: cb.teacher ? { _id: cb.teacher_id, name: cb.teacher.name, email: cb.teacher.email } : cb.teacher_id
    }));
    delete data.courseBatches;
  }
  return data;
};

// @desc    Get courses (role-filtered)
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const { role, batch_id } = req.user;
    const userId = req.user.id;

    let whereClause = {};
    let includeOpts = [{
      model: CourseBatchTeacher,
      as: 'courseBatches',
      include: [
        { model: User, as: 'teacher', attributes: ['name', 'email'] },
        { model: Batch, as: 'batch', attributes: ['name', 'year', 'department'] }
      ]
    }];

    // Optional filters via query params
    const { semester, year, department } = req.query;
    if (semester) whereClause.semester = Number(semester);
    if (year) whereClause.year = Number(year);
    if (department) whereClause.department = department;

    let courses;
    if (role === 'teacher') {
      // Find courses where this teacher is assigned via junction table
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { teacher_id: userId }, attributes: ['course_id'] });
      const courseIds = [...new Set(cbtRecords.map(r => r.course_id))];
      whereClause.id = { [Op.in]: courseIds };
      courses = await Course.findAll({ where: whereClause, include: includeOpts, order: [['semester', 'ASC'], ['name', 'ASC'], ['created_at', 'DESC']] });
    } else if (role === 'student') {
      // Find courses that include student's batch
      const cbtRecords = await CourseBatchTeacher.findAll({ where: { batch_id: batch_id }, attributes: ['course_id'] });
      const courseIds = [...new Set(cbtRecords.map(r => r.course_id))];
      whereClause.id = { [Op.in]: courseIds };
      courses = await Course.findAll({ where: whereClause, include: includeOpts, order: [['semester', 'ASC'], ['name', 'ASC'], ['created_at', 'DESC']] });
    } else {
      // admin sees all
      courses = await Course.findAll({ where: whereClause, include: includeOpts, order: [['semester', 'ASC'], ['name', 'ASC'], ['created_at', 'DESC']] });
    }

    res.json({ success: true, data: courses.map(formatCourseResponse) });
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

    const course = await Course.create({
      name,
      code: code || null,
      description,
      credits,
      department,
      semester: semester || null,
      year: year || null,
      regulation: regulation || ''
    });

    // Create junction table entries for batches
    if (batches && batches.length > 0) {
      const cbtEntries = batches.map(b => ({
        course_id: course.id,
        batch_id: b.batch_id,
        teacher_id: b.teacher_id
      }));
      await CourseBatchTeacher.bulkCreate(cbtEntries);
    }

    // Fetch populated
    const populated = await Course.findByPk(course.id, {
      include: [{
        model: CourseBatchTeacher, as: 'courseBatches',
        include: [
          { model: User, as: 'teacher', attributes: ['name', 'email'] },
          { model: Batch, as: 'batch', attributes: ['name', 'year', 'department'] }
        ]
      }]
    });

    res.status(201).json({ success: true, data: formatCourseResponse(populated), message: 'Course created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const { name, code, description, credits, department, semester, year, regulation, batches } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (credits !== undefined) updateData.credits = credits;
    if (department !== undefined) updateData.department = department;
    if (semester !== undefined) updateData.semester = semester;
    if (year !== undefined) updateData.year = year;
    if (regulation !== undefined) updateData.regulation = regulation;

    await course.update(updateData);

    // Update junction table if batches provided
    if (batches !== undefined) {
      await CourseBatchTeacher.destroy({ where: { course_id: course.id } });
      if (batches.length > 0) {
        const cbtEntries = batches.map(b => ({
          course_id: course.id,
          batch_id: b.batch_id,
          teacher_id: b.teacher_id
        }));
        await CourseBatchTeacher.bulkCreate(cbtEntries);
      }
    }

    const populated = await Course.findByPk(course.id, {
      include: [{
        model: CourseBatchTeacher, as: 'courseBatches',
        include: [
          { model: User, as: 'teacher', attributes: ['name', 'email'] },
          { model: Batch, as: 'batch', attributes: ['name', 'year', 'department'] }
        ]
      }]
    });

    res.json({ success: true, data: formatCourseResponse(populated), message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // CASCADE will handle CourseBatchTeacher, Assignment, Attendance, Marks, Exam
    await course.destroy();

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
