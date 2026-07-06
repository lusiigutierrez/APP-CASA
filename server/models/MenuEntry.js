const mongoose = require('mongoose');

// Un documento por casa. day: 'lun'..'dom', meal: 'comida'|'cena'
const menuEntrySchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // { lun: { comida, cena }, mar: {...}, ... }
}, { timestamps: true });

module.exports = mongoose.model('MenuEntry', menuEntrySchema);
