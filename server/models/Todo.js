const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  due_date:    { type: Date },
  completed:   { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', todoSchema);
