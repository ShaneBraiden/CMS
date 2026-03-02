const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  year:       { type: String, default: '' },
  department: { type: String, default: '' },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);
