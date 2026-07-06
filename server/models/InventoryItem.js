const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  name: { type: String, required: true },
  qty: { type: Number, default: 0 },
  unit: { type: String, default: 'uds' },
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
