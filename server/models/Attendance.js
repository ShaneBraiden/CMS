const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date:          { type: Date, required: true },
  status:        { type: String, enum: ['present', 'absent'], default: 'absent' },
  hourly_status: { type: [String], default: ['N', 'N', 'N', 'N', 'N', 'N', 'N'] },
  marked_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  marked_at:     { type: Date, default: Date.now },
  updated_at:    { type: Date, default: Date.now }
});

attendanceSchema.index({ student_id: 1, course_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
