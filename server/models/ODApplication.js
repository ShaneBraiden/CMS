const mongoose = require('mongoose');

const odApplicationSchema = new mongoose.Schema({
  student_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date:  { type: Date, required: true },
  end_date:    { type: Date, required: true },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  remarks:     { type: String, default: '' },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('ODApplication', odApplicationSchema);
