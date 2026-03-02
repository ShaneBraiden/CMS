const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, unique: true, sparse: true, trim: true },
  description: { type: String, default: '' },
  credits:     { type: Number, default: 0 },
  department:  { type: String, default: '' },
  semester:    { type: Number, default: null },       // e.g. 1, 2, 3..8
  year:        { type: Number, default: null },        // e.g. 1, 2, 3, 4
  regulation:  { type: String, default: '', trim: true }, // e.g. 'R2024', 'R2020'
  // Each entry = one batch + its assigned faculty for this course
  batches: [{
    batch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});

courseSchema.pre('save', function () {
  this.updated_at = Date.now();
});

module.exports = mongoose.model('Course', courseSchema);
