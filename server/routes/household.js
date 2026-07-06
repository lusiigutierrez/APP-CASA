const express = require('express');
const Household = require('../models/Household');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Si la casa no tiene creador registrado (casas creadas antes de esta función),
// se adopta a la cuenta más antigua de la casa como creadora.
async function ensureOwner(household) {
  if (household.owner) return household.owner;
  const earliest = await User.findOne({ household: household._id }).sort({ createdAt: 1 });
  if (earliest) {
    household.owner = earliest._id;
    await household.save();
  }
  return household.owner;
}

router.get('/', async (req, res) => {
  const household = await Household.findById(req.householdId);
  res.json(household);
});

router.get('/users', async (req, res) => {
  const household = await Household.findById(req.householdId);
  const ownerId = await ensureOwner(household);
  const users = await User.find({ household: req.householdId }).sort({ createdAt: 1 });
  res.json({
    ownerId,
    users: users.map(u => ({ id: u._id, name: u.name, email: u.email, memberId: u.memberId, createdAt: u.createdAt })),
  });
});

router.delete('/users/:userId', async (req, res) => {
  const household = await Household.findById(req.householdId);
  const ownerId = await ensureOwner(household);
  if (!ownerId || ownerId.toString() !== req.userId) {
    return res.status(403).json({ error: 'Solo quien creó la casa puede expulsar usuarios.' });
  }
  if (req.params.userId === req.userId) {
    return res.status(400).json({ error: 'No puedes expulsarte a ti mismo.' });
  }
  const removed = await User.findOneAndDelete({ _id: req.params.userId, household: req.householdId });
  if (!removed) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json({ ok: true });
});

router.patch('/name', async (req, res) => {
  const household = await Household.findByIdAndUpdate(
    req.householdId, { name: req.body.name }, { new: true }
  );
  res.json(household);
});

router.patch('/photo', async (req, res) => {
  const household = await Household.findByIdAndUpdate(
    req.householdId, { photo: req.body.photo || '' }, { new: true }
  );
  res.json(household);
});

router.post('/members', async (req, res) => {
  const { name, color } = req.body;
  const household = await Household.findById(req.householdId);
  household.members.push({ name, color });
  await household.save();
  res.json(household);
});

router.patch('/members/:memberId', async (req, res) => {
  const household = await Household.findById(req.householdId);
  const member = household.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ error: 'Miembro no encontrado.' });
  if (req.body.name !== undefined) member.name = req.body.name;
  if (req.body.color !== undefined) member.color = req.body.color;
  if (req.body.photo !== undefined) member.photo = req.body.photo;
  await household.save();
  res.json(household);
});

router.delete('/members/:memberId', async (req, res) => {
  const household = await Household.findById(req.householdId);
  household.members.pull({ _id: req.params.memberId });
  await household.save();
  res.json(household);
});

router.put('/budgets', async (req, res) => {
  const household = await Household.findById(req.householdId);
  household.budgets = req.body.budgets || {};
  await household.save();
  res.json(household);
});

module.exports = router;
