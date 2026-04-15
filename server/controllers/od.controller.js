const { ODApplication, User } = require('../models');
const { createNotification } = require('../utils/helpers');

// @desc    Apply for OD
// @route   POST /api/od/apply
exports.applyOD = async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;
    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, error: 'Start date, end date, and reason are required' });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, error: 'Start date must be before end date' });
    }

    const application = await ODApplication.create({ student_id: req.user.id, start_date, end_date, reason });
    const data = application.toJSON(); data._id = data.id;
    res.status(201).json({ success: true, data, message: 'OD application submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student's OD applications
// @route   GET /api/od/status
exports.getODStatus = async (req, res) => {
  try {
    const applications = await ODApplication.findAll({
      where: { student_id: req.user.id },
      include: [{ model: User, as: 'approver', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    const formatted = applications.map(a => {
      const d = a.toJSON(); d._id = d.id;
      if (d.approver) { d.approved_by = { _id: d.approved_by, name: d.approver.name }; delete d.approver; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get pending OD applications for approval
// @route   GET /api/od/approvals
exports.getODApprovals = async (req, res) => {
  try {
    const applications = await ODApplication.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'student', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']]
    });

    const formatted = applications.map(a => {
      const d = a.toJSON(); d._id = d.id;
      if (d.student) { d.student_id = { _id: d.student_id, name: d.student.name, email: d.student.email }; delete d.student; }
      return d;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve or reject OD
// @route   PUT /api/od/approvals/:id
exports.approveRejectOD = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status (approved/rejected) is required' });
    }

    const application = await ODApplication.findByPk(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'OD application not found' });
    }

    await application.update({
      status,
      approved_by: req.user.id,
      remarks: remarks || ''
    });

    // Notify student
    await createNotification(
      application.student_id,
      `Your OD application has been ${status}${remarks ? ': ' + remarks : ''}`,
      'od',
      application.id
    );

    const populated = await ODApplication.findByPk(application.id, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: User, as: 'approver', attributes: ['name'] }
      ]
    });

    const data = populated.toJSON(); data._id = data.id;
    if (data.student) { data.student_id = { _id: data.student_id, name: data.student.name, email: data.student.email }; delete data.student; }
    if (data.approver) { data.approved_by = { _id: data.approved_by, name: data.approver.name }; delete data.approver; }

    res.json({ success: true, data, message: `OD application ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
