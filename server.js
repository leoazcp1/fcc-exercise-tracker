// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Modelo User
const User = require('./models/User');

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));

// RUTA RAÍZ (opcional, para probar que el servidor está vivo)
app.get('/', (req, res) => {
  res.send('Exercise Tracker API funcionando 🚀');
});

// ======================
//   RUTAS FCC
// ======================

// Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username es obligatorio' });
    }

    const newUser = new User({ username, log: [] });
    await newUser.save();

    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (err) {
    console.error('ERROR AL CREAR USUARIO:', err);
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// Listar usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    console.error('ERROR OBTENIENDO USUARIOS:', err);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// Agregar ejercicio
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'description y duration son obligatorios' });
    }

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const parsedDate = date ? new Date(date) : new Date();

    const exercise = {
      description,
      duration: parseInt(duration),
      date: parsedDate,
    };

    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description,
    });
  } catch (err) {
    console.error('ERROR AL AGREGAR EJERCICIO:', err);
    res.status(500).json({ error: 'Error agregando ejercicio' });
  }
});

// Obtener logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    let { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let logs = user.log;

    if (from) {
      const fromDate = new Date(from);
      logs = logs.filter((e) => e.date >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      logs = logs.filter((e) => e.date <= toDate);
    }

    if (limit) {
      limit = parseInt(limit);
      logs = logs.slice(0, limit);
    }

    const logMapped = logs.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: logMapped.length,
      log: logMapped,
    });
  } catch (err) {
    console.error('ERROR OBTENIENDO LOGS:', err);
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
});

// ======================
//   LEVANTAR SERVIDOR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
