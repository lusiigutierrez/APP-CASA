const express = require('express');
const requireAuth = require('../middleware/auth');
const Expense = require('../models/Expense');
const RecurringExpense = require('../models/RecurringExpense');

const router = express.Router();
router.use(requireAuth);

function monthKey(d) { return d.toISOString().slice(0, 7); }
function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
function dateForMonth(mKey, dayOfMonth) {
  const [y, m] = mKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(dayOfMonth || 1, daysInMonth);
  return `${mKey}-${String(day).padStart(2, '0')}`;
}

// Crea los gastos de los meses que falten (hasta el mes actual) para cada plantilla recurrente activa.
async function generateDueExpenses(householdId) {
  const templates = await RecurringExpense.find({ household: householdId, active: true });
  const currentMonth = monthKey(new Date());
  for (const t of templates) {
    let cursor = t.lastGeneratedMonth ? addMonths(t.lastGeneratedMonth, 1) : t.startMonth;
    const monthsToCreate = [];
    let guard = 0;
    while (cursor <= currentMonth && guard < 36) {
      monthsToCreate.push(cursor);
      cursor = addMonths(cursor, 1);
      guard++;
    }
    if (monthsToCreate.length) {
      await Expense.insertMany(monthsToCreate.map(mKey => ({
        household: householdId, desc: t.desc, amount: t.amount, category: t.category,
        person: t.person, date: dateForMonth(mKey, t.dayOfMonth), recurringSource: t._id,
      })));
      t.lastGeneratedMonth = monthsToCreate[monthsToCreate.length - 1];
      await t.save();
    }
  }
}

router.get('/', async (req, res) => {
  await generateDueExpenses(req.householdId);
  const items = await Expense.find({ household: req.householdId }).sort({ createdAt: 1 });
  res.json(items);
});

router.post('/', async (req, res) => {
  const item = await Expense.create({ ...req.body, household: req.householdId });
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  const item = await Expense.findOneAndUpdate(
    { _id: req.params.id, household: req.householdId }, req.body, { new: true }
  );
  if (!item) return res.status(404).json({ error: 'No encontrado.' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  await Expense.deleteOne({ _id: req.params.id, household: req.householdId });
  res.json({ ok: true });
});

// ---- Plantillas de gastos recurrentes ----
router.get('/recurring', async (req, res) => {
  const items = await RecurringExpense.find({ household: req.householdId }).sort({ createdAt: 1 });
  res.json(items);
});

router.post('/recurring', async (req, res) => {
  const { desc, amount, category, person, dayOfMonth } = req.body;
  if (!desc || !amount || !category) return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  const item = await RecurringExpense.create({
    household: req.householdId, desc, amount, category, person: person || 'shared',
    dayOfMonth: Number(dayOfMonth) || 1, startMonth: monthKey(new Date()),
  });
  res.status(201).json(item);
});

router.patch('/recurring/:id', async (req, res) => {
  const item = await RecurringExpense.findOneAndUpdate(
    { _id: req.params.id, household: req.householdId }, req.body, { new: true }
  );
  if (!item) return res.status(404).json({ error: 'No encontrado.' });
  res.json(item);
});

router.delete('/recurring/:id', async (req, res) => {
  await RecurringExpense.deleteOne({ _id: req.params.id, household: req.householdId });
  res.json({ ok: true });
});

module.exports = router;
