const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');

exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email y password son obligatorios' });

  const usuario = await Usuario.obtenerPorEmailConPassword(email);
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  const { password_hash, ...datos } = usuario;
  res.json({ token, usuario: datos });
};