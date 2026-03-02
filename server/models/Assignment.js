const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  due_date:    { type: Date },
  total_marks: { type: Number, default: 100 },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
