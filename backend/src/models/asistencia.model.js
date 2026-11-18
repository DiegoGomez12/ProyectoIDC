const pool = require('../config/db');

const COLUMNAS = `
  id,
  usuario_id,
  hora_entrada,
  hora_salida,
  estatus,
  CASE
    WHEN hora_salida IS NOT NULL THEN ROUND((EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600.0)::numeric, 2)
    ELSE NULL
  END AS horas_trabajadas
`;

/**
 * Busca si el usuario tiene una jornada abierta (sin check-out)
 */
exports.obtenerActivaPorUsuario = async (usuarioId) => {
  const query = `
    SELECT id, usuario_id, hora_entrada, hora_salida, estatus
    FROM asistencias
    WHERE usuario_id = $1 AND estatus = 'activo'
    ORDER BY hora_entrada DESC
    LIMIT 1
  `;
  const res = await pool.query(query, [usuarioId]);
  return res.rows[0];
};

/**
 * Inserta un nuevo Check-in con hora actual y estatus 'activo'
 */
exports.registrarEntrada = async (usuarioId) => {
  const query = `
    INSERT INTO asistencias (usuario_id, hora_entrada, estatus)
    VALUES ($1, NOW(), 'activo')
    RETURNING id, usuario_id, hora_entrada, hora_salida, estatus, 0 AS horas_trabajadas
  `;
  const res = await pool.query(query, [usuarioId]);
  return res.rows[0];
};

/**
 * Registra el Check-out actualizando la hora_salida y marcando como 'completado'
 */
exports.registrarSalida = async (asistenciaId) => {
  const query = `
    UPDATE asistencias
    SET hora_salida = NOW(),
        estatus = 'completado'
    WHERE id = $1
    RETURNING ${COLUMNAS}
  `;
  const res = await pool.query(query, [asistenciaId]);
  return res.rows[0];
};

/**
 * Obtiene el historial completo de asistencias de un empleado
 */
exports.obtenerPorUsuario = async (usuarioId) => {
  const query = `
    SELECT ${COLUMNAS}
    FROM asistencias
    WHERE usuario_id = $1
    ORDER BY hora_entrada DESC
  `;
  const res = await pool.query(query, [usuarioId]);
  return res.rows;
};

/**
 * Lista general de asistencias para administradores (con soporte de filtros opcionales)
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

  const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const query = `
    SELECT 
      a.id,
      a.usuario_id,
      u.nombre AS usuario_nombre,
      u.email AS usuario_email,
      a.hora_entrada,
      a.hora_salida,
      a.estatus,
      CASE
        WHEN a.hora_salida IS NOT NULL THEN ROUND((EXTRACT(EPOCH FROM (a.hora_salida - a.hora_entrada)) / 3600.0)::numeric, 2)
        ELSE NULL
      END AS horas_trabajadas
    FROM asistencias a
    JOIN usuarios u ON a.usuario_id = u.id
    ${whereClause}
    ORDER BY a.hora_entrada DESC
  `;

  const res = await pool.query(query, valores);
  return res.rows;
};
