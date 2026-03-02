const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student_name:  { type: String },
  file_path:     { type: String },
  filename:      { type: String },
  comments:      { type: String, default: '' },
  submitted_at:  { type: Date, default: Date.now },
  status:        { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  marks:         { type: Number, default: null },
  feedback:      { type: String, default: '' },
  graded_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  graded_at:     { type: Date }
});

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
