const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  desc: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  person: { type: String, default: 'shared' },
  dayOfMonth: { type: Number, default: 1 }, // día del mes en que se genera el gasto
  startMonth: { type: String, required: true }, // 'YYYY-MM', primer mes a generar
  lastGeneratedMonth: { type: String, default: null }, // 'YYYY-MM', último mes ya generado
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
