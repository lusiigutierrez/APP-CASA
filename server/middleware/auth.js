const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('household');
    if (!user) {
      return res.status(401).json({ error: 'Sesión inválida o caducada.' });
    }
    req.userId = payload.userId;
    req.householdId = user.household.toString();
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sesión inválida o caducada.' });
  }
};
