const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Household = require('../models/Household');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const MEMBER_COLORS = ['#B7D0EC', '#F4C9BC', '#BFE0D0', '#F6DFA6', '#DCC6EA', '#A9DED2', '#EFC7D6', '#C6CDE8'];

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), householdId: user.household.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
// body: { email, password, name, inviteCode? , homeName? }
// Si se manda inviteCode, el usuario se une a una casa existente.
// Si no, se crea una casa nueva (y se puede indicar homeName).
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, inviteCode, homeName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    let household;
    let isNewHousehold = false;
    if (inviteCode) {
      household = await Household.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (!household) {
        return res.status(404).json({ error: 'Código de invitación no válido.' });
      }
    } else {
      household = await Household.create({ name: homeName || 'Nuestra casa' });
      isNewHousehold = true;
    }

    const color = MEMBER_COLORS[household.members.length % MEMBER_COLORS.length];
    household.members.push({ name, color });
    await household.save();
    const newMember = household.members[household.members.length - 1];

    const user = new User({ email: email.toLowerCase().trim(), name, household: household._id, memberId: newMember._id });
    await user.setPassword(password);
    await user.save();

    if (isNewHousehold) {
      household.owner = user._id;
      await household.save();
    }

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON(), household });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando la cuenta.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
    if (!user || !(await user.checkPassword(password || ''))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }
    const token = signToken(user);
    const household = await Household.findById(user.household);
    res.json({ token, user: user.toSafeJSON(), household });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error iniciando sesión.' });
  }
});

// GET /api/auth/me — para restaurar sesión al recargar la app
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const household = await Household.findById(user.household);
    res.json({ user: user.toSafeJSON(), household });
  } catch (e) {
    res.status(500).json({ error: 'Error cargando la sesión.' });
  }
});

// PATCH /api/auth/me — cambiar preferencia personal (modo oscuro)
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { darkMode } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { darkMode: !!darkMode }, { new: true });
    res.json({ user: user.toSafeJSON() });
  } catch (e) {
    res.status(500).json({ error: 'Error guardando la preferencia.' });
  }
});

module.exports = router;
