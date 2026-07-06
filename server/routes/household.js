const express = require('express');
const Household = require('../models/Household');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const household = await Household.findById(req.householdId);
  res.json(household);
});

router.patch('/name', async (req, res) => {
  const household = await Household.findByIdAndUpdate(
    req.householdId, { name: req.body.name }, { new: true }
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
