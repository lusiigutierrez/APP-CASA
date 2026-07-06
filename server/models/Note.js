const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  text: { type: String, default: '' },
  color: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
