// URL base del backend tomada de variables de entorno o localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{token: string, usuario: object}>}
 */
export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Error al iniciar sesión');
  }
  return data;
}

/**
 * Registro de un nuevo empleado
 * @param {object} usuarioDatos 
 */
export async function registrarUsuario(usuarioDatos) {
  const response = await fetch(`${API_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuarioDatos)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Error al registrar usuario');
  }
  return data;
}
