const jwt = require('jsonwebtoken');

exports.autenticar = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, rol }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

exports.soloAdmin = (req, res, next) =>
  req.usuario.rol === 'admin' ? next() : res.status(403).json({ error: 'Requiere rol admin' });