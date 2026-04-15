const { Timetable, TimetableSlot, Batch } = require('../models');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper: transform timetable with slots to day-based structure
const formatTimetableResponse = (tt) => {
  if (!tt) return null;
  const data = tt.toJSON();
  data._id = data.id;
  // Reconstruct day-based nested structure
  data.timetable = {};
  DAYS.forEach(day => {
    data.timetable[day] = (data.slots || [])
      .filter(s => s.day === day)
      .sort((a, b) => a.hour - b.hour)
      .map(s => ({ hour: s.hour, subject: s.subject, faculty: s.faculty, room: s.room }));
  });
  delete data.slots;
  // Format batch populate
  if (data.batch) {
    data.batch_id = { _id: data.batch_id, name: data.batch.name };
    delete data.batch;
  }
  return data;
};

// @desc    Get timetables
// @route   GET /api/timetables
exports.getTimetables = async (req, res) => {
  try {
    const { role, batch_id } = req.user;

    const includeOpts = [
      { model: Batch, as: 'batch', attributes: ['name'] },
      { model: TimetableSlot, as: 'slots' }
    ];

    if (role === 'student' && batch_id) {
      const timetable = await Timetable.findOne({ where: { batch_id }, include: includeOpts });
      return res.json({ success: true, data: formatTimetableResponse(timetable) });
    }

    // Admin/teacher: all timetables
    const timetables = await Timetable.findAll({ include: includeOpts });
    res.json({ success: true, data: timetables.map(formatTimetableResponse) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get timetable by batch ID
// @route   GET /api/timetables/:batch_id
exports.getTimetableByBatch = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      where: { batch_id: req.params.batch_id },
      include: [
        { model: Batch, as: 'batch', attributes: ['name'] },
        { model: TimetableSlot, as: 'slots' }
      ]
    });

    if (!timetable) {
      return res.status(404).json({ success: false, error: 'Timetable not found for this batch' });
    }

    res.json({ success: true, data: formatTimetableResponse(timetable) });
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

    const batch = await Batch.findByPk(batch_id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Find or create timetable
    let [tt, created] = await Timetable.findOrCreate({
      where: { batch_id },
      defaults: { batch_id }
    });

    // Delete existing slots and re-create
    await TimetableSlot.destroy({ where: { timetable_id: tt.id } });

    // Create new slots from timetable data
    const slots = [];
    DAYS.forEach(day => {
      if (timetable[day] && Array.isArray(timetable[day])) {
        timetable[day].forEach(slot => {
          slots.push({
            timetable_id: tt.id,
            day,
            hour: slot.hour,
            subject: slot.subject || '',
            faculty: slot.faculty || '',
            room: slot.room || ''
          });
        });
      }
    });

    if (slots.length > 0) {
      await TimetableSlot.bulkCreate(slots);
    }

    // Update timestamp
    await tt.update({ updated_at: new Date() });

    // Fetch populated result
    const result = await Timetable.findByPk(tt.id, {
      include: [
        { model: Batch, as: 'batch', attributes: ['name'] },
        { model: TimetableSlot, as: 'slots' }
      ]
    });

    res.json({ success: true, data: formatTimetableResponse(result), message: 'Timetable saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetables/:batch_id
exports.deleteTimetable = async (req, res) => {
  try {
    const result = await Timetable.findOne({ where: { batch_id: req.params.batch_id } });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Timetable not found' });
    }
    // CASCADE handles TimetableSlot deletion
    await result.destroy();
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
