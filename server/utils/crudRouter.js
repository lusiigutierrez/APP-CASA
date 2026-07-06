const express = require('express');
const requireAuth = require('../middleware/auth');

// Crea un router con GET (listar), POST (crear), PATCH (actualizar) y DELETE
// para un modelo Mongoose cuyo esquema incluye el campo `household`.
function makeCrudRouter(Model) {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const items = await Model.find({ household: req.householdId }).sort({ createdAt: 1 });
    res.json(items);
  });

  router.post('/', async (req, res) => {
    const item = await Model.create({ ...req.body, household: req.householdId });
    res.status(201).json(item);
  });

  router.patch('/:id', async (req, res) => {
    const item = await Model.findOneAndUpdate(
      { _id: req.params.id, household: req.householdId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'No encontrado.' });
    res.json(item);
  });

  router.delete('/:id', async (req, res) => {
    await Model.deleteOne({ _id: req.params.id, household: req.householdId });
    res.json({ ok: true });
  });

  return router;
}

module.exports = makeCrudRouter;
