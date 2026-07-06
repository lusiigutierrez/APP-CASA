const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  title: { type: String, required: true },
  date: { type: String, required: true },      // 'YYYY-MM-DD'
  endDate: { type: String },                    // 'YYYY-MM-DD', para eventos de varios días
  allDay: { type: Boolean, default: false },
  time: { type: String, default: '' },          // 'HH:MM'
  who: { type: String, default: 'shared' },      // id de miembro o 'shared'
  recurring: { type: String, enum: ['none', 'weekly', 'monthly', 'yearly'], default: 'none' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
