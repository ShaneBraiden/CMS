const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  exam_date:  { type: Date },
  start_time: { type: String },
  duration:   { type: String },
  venue:      { type: String, default: '' },
  exam_type:  { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
