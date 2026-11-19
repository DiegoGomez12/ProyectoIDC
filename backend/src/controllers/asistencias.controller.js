const Asistencia = require('../models/asistencia.model');

/**
 * Registrar entrada (Check-in)
 * Regla de negocio: Bloquea si ya existe una jornada activa sin check-out
 */
exports.checkIn = async (req, res) => {
  const usuarioId = req.usuario.id;

  const activa = await Asistencia.obtenerActivaPorUsuario(usuarioId);
  if (activa) {
    return res.status(400).json({
      error: 'Ya cuentas con una jornada activa sin registrar salida'
    });
  }

  try {
    const nuevoRegistro = await Asistencia.registrarEntrada(usuarioId);
    res.status(201).json(nuevoRegistro);
  } catch (err) {
    // El índice único de la BD detectó otra jornada activa (dos check-in casi simultáneos)
    if (err.code === '23505') {
      return res.status(400).json({
        error: 'Ya cuentas con una jornada activa sin registrar salida'
      });
    }
    throw err;
  }
};

/**
 * Registrar salida (Check-out)
 * Regla de negocio: Bloquea si no existe una jornada activa previa
 */
exports.checkOut = async (req, res) => {
  const usuarioId = req.usuario.id;

  const activa = await Asistencia.obtenerActivaPorUsuario(usuarioId);
  if (!activa) {
    return res.status(400).json({
      error: 'No cuentas con una jornada activa para registrar salida'
    });
  }

  const registroCerrado = await Asistencia.registrarSalida(activa.id);
  res.status(200).json(registroCerrado);
};

/**
 * Consultar el historial personal de asistencias del usuario autenticado
 */
exports.misRegistros = async (req, res) => {
  const usuarioId = req.usuario.id;
  const registros = await Asistencia.obtenerPorUsuario(usuarioId);
  res.json(registros);
};

/**
 * Consultar si el usuario actual tiene o no un turno activo (útil para el frontend)
 */
exports.obtenerEstado = async (req, res) => {
  const usuarioId = req.usuario.id;
  const activa = await Asistencia.obtenerActivaPorUsuario(usuarioId);
  res.json({
    tieneCheckInActivo: !!activa,
    registroActivo: activa || null
  });
};

/**
 * Listado general para Administradores con filtros opcionales (fecha, usuarioId)
 */
exports.listar = async (req, res) => {
  const { fecha, usuarioId } = req.query;
  const registros = await Asistencia.listar({ fecha, usuarioId });
  res.json(registros);
};
