const mongoose = require('mongoose');

const hourSlotSchema = new mongoose.Schema({
  hour:    { type: Number },
  subject: { type: String, default: '' },
  faculty: { type: String, default: '' },
  room:    { type: String, default: '' }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, unique: true },
  timetable: {
    Monday:    [hourSlotSchema],
    Tuesday:   [hourSlotSchema],
    Wednesday: [hourSlotSchema],
    Thursday:  [hourSlotSchema],
    Friday:    [hourSlotSchema]
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', timetableSchema);
