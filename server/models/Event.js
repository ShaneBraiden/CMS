const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  event_date:  { type: Date },
  location:    { type: String, default: '' },
  event_type:  { type: String, default: '' },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
