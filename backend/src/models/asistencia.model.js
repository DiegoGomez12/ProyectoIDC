const pool = require('../config/db');
const { calcularHoras } = require('../utils/tiempo');

const COLUMNAS = 'id, usuario_id, hora_entrada, hora_salida, estatus';

// Agrega horas_trabajadas como número (o null si la jornada sigue activa)
const conHoras = (registro) => registro && {
  ...registro,
  horas_trabajadas: registro.hora_salida
    ? calcularHoras(registro.hora_entrada, registro.hora_salida)
    : null,
};

/**
 * Busca si el usuario tiene una jornada abierta (sin check-out)
 */
exports.obtenerActivaPorUsuario = async (usuarioId) => {
  const res = await pool.query(
    `SELECT ${COLUMNAS}
       FROM asistencias
      WHERE usuario_id = $1 AND estatus = 'activo'
      ORDER BY hora_entrada DESC
      LIMIT 1`,
    [usuarioId],
  );
  return res.rows[0];
};

/**
 * Inserta un nuevo Check-in (hora_entrada = NOW() y estatus 'activo' por defecto)
 */
exports.registrarEntrada = async (usuarioId) => {
  const res = await pool.query(
    `INSERT INTO asistencias (usuario_id) VALUES ($1) RETURNING ${COLUMNAS}`,
    [usuarioId],
  );
  return conHoras(res.rows[0]);
};

/**
 * Registra el Check-out: guarda hora_salida y marca la jornada como 'completado'
 */
exports.registrarSalida = async (asistenciaId) => {
  const res = await pool.query(
    `UPDATE asistencias
        SET hora_salida = NOW(), estatus = 'completado'
      WHERE id = $1
      RETURNING ${COLUMNAS}`,
    [asistenciaId],
  );
  return conHoras(res.rows[0]);
};

/**
 * Historial completo de asistencias de un empleado
 */
exports.obtenerPorUsuario = async (usuarioId) => {
  const res = await pool.query(
    `SELECT ${COLUMNAS}
       FROM asistencias
      WHERE usuario_id = $1
      ORDER BY hora_entrada DESC`,
    [usuarioId],
  );
  return res.rows.map(conHoras);
};

/**
 * Lista general para administradores (filtros opcionales: fecha, usuarioId)
 */
exports.listar = async ({ fecha, usuarioId } = {}) => {
  const condiciones = [];
  const valores = [];

  if (fecha) {
    valores.push(fecha);
    condiciones.push(`DATE(a.hora_entrada) = $${valores.length}`);
  }
  if (usuarioId) {
    valores.push(usuarioId);
    condiciones.push(`a.usuario_id = $${valores.length}`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const res = await pool.query(
    `SELECT a.id, a.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
            a.hora_entrada, a.hora_salida, a.estatus
       FROM asistencias a
       JOIN usuarios u ON a.usuario_id = u.id
       ${where}
      ORDER BY a.hora_entrada DESC`,
    valores,
  );
  return res.rows.map(conHoras);
};