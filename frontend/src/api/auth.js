// URL base del backend tomada de variables de entorno o localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{token: string, usuario: object}>}
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data === null) {
      throw new Error(data?.error || data?.mensaje || 'Credenciales incorrectas');
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor (API fuera de línea).');
    }
    throw err;
  }
}

/**
 * Registro de un nuevo empleado
 * @param {{nombre: string, email: string, password: string}} usuarioDatos 
 * @returns {Promise<object>}
 */
export async function registrarUsuario(usuarioDatos) {
  try {
    const response = await fetch(`${API_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioDatos)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data === null) {
      throw new Error(data?.error || data?.mensaje || 'Error al registrar el usuario');
    }
    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor (API fuera de línea).');
    }
    throw err;
  }
}
