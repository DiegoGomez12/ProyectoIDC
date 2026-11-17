const pool = require('../config/db');
const COLUMNAS = 'id, nombre, email, rol, creado_en';

exports.crear = async ({ nombre, email, passwordHash, rol = 'empleado' }) =>
  (await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4) RETURNING ${COLUMNAS}`,
    [nombre, email, passwordHash, rol],
  )).rows[0];

exports.listar = async () =>
  (await pool.query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY creado_en`)).rows;

exports.obtenerPorId = async (id) =>
  (await pool.query(`SELECT ${COLUMNAS} FROM usuarios WHERE id = $1`, [id])).rows[0];

// Solo para login: incluye password_hash
exports.obtenerPorEmailConPassword = async (email) =>
  (await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])).rows[0];

exports.actualizar = async (id, { nombre, email, rol }) =>
  (await pool.query(
    `UPDATE usuarios
        SET nombre = COALESCE($2, nombre),
            email  = COALESCE($3, email),
            rol    = COALESCE($4, rol)
      WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, nombre, email, rol],
  )).rows[0];

exports.eliminar = async (id) =>
  (await pool.query('DELETE FROM usuarios WHERE id = $1', [id])).rowCount > 0;