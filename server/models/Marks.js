const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  exam_type:  { type: String, default: '' },
  marks:      { type: Number, required: true },
  max_marks:  { type: Number, default: 100 },
  date:       { type: Date },
  remarks:    { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Marks', marksSchema);
