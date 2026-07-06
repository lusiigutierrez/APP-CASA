const express = require('express');
const MenuEntry = require('../models/MenuEntry');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  let entry = await MenuEntry.findOne({ household: req.householdId });
  if (!entry) entry = await MenuEntry.create({ household: req.householdId, data: {} });
  res.json(entry.data);
});

router.put('/', async (req, res) => {
  const entry = await MenuEntry.findOneAndUpdate(
    { household: req.householdId },
    { data: req.body.data || {} },
    { new: true, upsert: true }
  );
  res.json(entry.data);
});

module.exports = router;
