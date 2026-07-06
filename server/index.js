require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const householdRoutes = require('./routes/household');
const eventsRoutes = require('./routes/events');
const shoppingRoutes = require('./routes/shopping');
const expensesRoutes = require('./routes/expenses');
const tasksRoutes = require('./routes/tasks');
const notesRoutes = require('./routes/notes');
const inventoryRoutes = require('./routes/inventory');
const menuRoutes = require('./routes/menu');

const app = express();
app.use(cors());
app.use(express.json());

// ---- API ----
app.use('/api/auth', authRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/menu', menuRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- Frontend compilado (una sola URL para todo) ----
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
