const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));


app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/asistencias', require('./routes/asistencias.routes'));

// Manejador de errores central (Express 5 manda aquí los errores de funciones async)
app.use((err, req, res, next) => {
  if (err.code === '22P02') return res.status(400).json({ error: 'ID inválido' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;