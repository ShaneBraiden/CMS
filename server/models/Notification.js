const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:      { type: String, required: true },
  type:         { type: String, enum: ['assignment', 'announcement', 'grade', 'od', 'general'], default: 'general' },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  read:         { type: Boolean, default: false },
  created_at:   { type: Date, default: Date.now }
});

notificationSchema.index({ user_id: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
