const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  text: { type: String, required: true },
  category: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ShoppingItem', shoppingItemSchema);
