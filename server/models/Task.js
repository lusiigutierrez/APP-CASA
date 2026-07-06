const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  text: { type: String, required: true },
  assignee: { type: String, default: 'shared' },
  done: { type: Boolean, default: false },
  recurring: { type: Boolean, default: false },
  frequencyDays: { type: Number, default: 7 },
  lastDone: { type: String, default: null }, // 'YYYY-MM-DD'
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
