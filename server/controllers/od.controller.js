const ODApplication = require('../models/ODApplication');
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

    const application = await ODApplication.create({
      student_id: req.user._id,
      start_date,
      end_date,
      reason
    });

    res.status(201).json({ success: true, data: application, message: 'OD application submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student's OD applications
// @route   GET /api/od/status
exports.getODStatus = async (req, res) => {
  try {
    const applications = await ODApplication.find({ student_id: req.user._id })
      .populate('approved_by', 'name')
      .sort({ created_at: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get pending OD applications for approval
// @route   GET /api/od/approvals
exports.getODApprovals = async (req, res) => {
  try {
    const applications = await ODApplication.find({ status: 'pending' })
      .populate('student_id', 'name email')
      .sort({ created_at: -1 });

    res.json({ success: true, data: applications });
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

    const application = await ODApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'OD application not found' });
    }

    application.status = status;
    application.approved_by = req.user._id;
    application.remarks = remarks || '';
    application.updated_at = new Date();
    await application.save();

    // Notify student
    await createNotification(
      application.student_id,
      `Your OD application has been ${status}${remarks ? ': ' + remarks : ''}`,
      'od',
      application._id
    );

    const populated = await ODApplication.findById(application._id)
      .populate('student_id', 'name email')
      .populate('approved_by', 'name');

    res.json({ success: true, data: populated, message: `OD application ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
