// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true })); // para form-encode
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));

// Ruta raíz (solo para ver que el server funciona)
app.get('/', (req, res) => {
  res.send('Exercise Tracker API funcionando');
});

//////////////////////
//   RUTAS USERS    //
//////////////////////

// Crear usuario
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'username es obligatorio' });
    }

    const newUser = new User({ username });
    const saved = await newUser.save();

    res.json({
      username: saved.username,
      _id: saved._id,
    });
  } catch (err) {
    console.error('ERROR AL CREAR USUARIO:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    console.error('ERROR AL OBTENER USUARIOS:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

////////////////////////
//   RUTAS EXERCISES  //
////////////////////////

// Agregar ejercicio a un usuario
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = (req.params._id || '').trim();
    const { description, duration, date } = req.body;

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!description || !duration) {
      return res
        .status(400)
        .json({ error: 'description y duration son obligatorios' });
    }

    const exerciseDate = date ? new Date(date) : new Date();

    const exercise = {
      description,
      duration: Number(duration),
      date: exerciseDate,
    };

    user.log.push(exercise);
    await user.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (err) {
    console.error('ERROR AL AGREGAR EJERCICIO:', err);
    res.status(500).json({ error: 'Error agregando ejercicio' });
  }
});

//////////////////////
//   RUTA LOGS      //
//////////////////////

// Obtener logs de un usuario (con from, to, limit)
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = (req.params._id || '').trim();
    let { from, to, limit } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let log = user.log;

    // Filtros de fecha
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate)) {
        log = log.filter((e) => e.date >= fromDate);
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate)) {
        log = log.filter((e) => e.date <= toDate);
      }
    }

    // Limit
    if (limit) {
      limit = Number(limit);
      if (!isNaN(limit)) {
        log = log.slice(0, limit);
      }
    }

    const logFormatted = log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    res.json({
      username: user.username,
      count: logFormatted.length,
      _id: user._id,
      log: logFormatted,
    });
  } catch (err) {
    console.error('ERROR AL OBTENER LOGS:', err);
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
