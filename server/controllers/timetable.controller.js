const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');

// @desc    Get timetables
// @route   GET /api/timetables
exports.getTimetables = async (req, res) => {
  try {
    const { role, batch_id } = req.user;

    if (role === 'student' && batch_id) {
      const timetable = await Timetable.findOne({ batch_id }).populate('batch_id', 'name');
      return res.json({ success: true, data: timetable });
    }

    // Admin/teacher: all timetables
    const timetables = await Timetable.find().populate('batch_id', 'name');
    res.json({ success: true, data: timetables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get timetable by batch ID
// @route   GET /api/timetables/:batch_id
exports.getTimetableByBatch = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ batch_id: req.params.batch_id })
      .populate('batch_id', 'name');

    if (!timetable) {
      return res.status(404).json({ success: false, error: 'Timetable not found for this batch' });
    }

    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update timetable
// @route   POST /api/timetables/upload
exports.createOrUpdateTimetable = async (req, res) => {
  try {
    const { batch_id, timetable } = req.body;

    if (!batch_id || !timetable) {
      return res.status(400).json({ success: false, error: 'Batch ID and timetable data are required' });
    }

    const batch = await Batch.findById(batch_id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const result = await Timetable.findOneAndUpdate(
      { batch_id },
      { batch_id, timetable, updated_at: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('batch_id', 'name');

    res.json({ success: true, data: result, message: 'Timetable saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetables/:batch_id
exports.deleteTimetable = async (req, res) => {
  try {
    const result = await Timetable.findOneAndDelete({ batch_id: req.params.batch_id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
