const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  desc: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  person: { type: String, default: 'shared' },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
