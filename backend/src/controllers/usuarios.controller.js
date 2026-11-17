const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');

const puedeAcceder = (req) => req.usuario.rol === 'admin' || req.usuario.id === req.params.id;

exports.crear = async (req, res) => {
  const { nombre, email, password } = req.body ?? {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    res.status(201).json(await Usuario.crear({ nombre, email, passwordHash }));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
    throw err;
  }
};

exports.listar = async (req, res) => res.json(await Usuario.listar());

exports.obtener = async (req, res) => {
  if (!puedeAcceder(req)) return res.status(403).json({ error: 'Sin permiso' });
  const usuario = await Usuario.obtenerPorId(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
};

exports.actualizar = async (req, res) => {
  if (!puedeAcceder(req)) return res.status(403).json({ error: 'Sin permiso' });
  const { nombre, email, rol } = req.body ?? {};
  const datos = { nombre, email, rol: req.usuario.rol === 'admin' ? rol : undefined };
  const usuario = await Usuario.actualizar(req.params.id, datos);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
};

exports.eliminar = async (req, res) => {
  const eliminado = await Usuario.eliminar(req.params.id);
  if (!eliminado) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.status(204).end();
};