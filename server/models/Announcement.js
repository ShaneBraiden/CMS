const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:           { type: String, default: '' },
  content:         { type: String, required: true },
  created_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by_name: { type: String },
  created_at:      { type: Date, default: Date.now },
  target_audience: { type: String, enum: ['all', 'students', 'teachers'], default: 'all' },
  priority:        { type: String, enum: ['high', 'normal', 'low'], default: 'normal' }
});

module.exports = mongoose.model('Announcement', announcementSchema);
