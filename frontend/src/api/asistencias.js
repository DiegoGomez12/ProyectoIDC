const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hace una petición autenticada a la API y devuelve el JSON.
 * Si algo falla lanza un Error; `error.status` trae el código HTTP cuando la API respondió.
 */
async function peticion(ruta, method = 'GET') {
  const token = localStorage.getItem('timecheck_token');

  let response;
  try {
    response = await fetch(`${API_URL}/api/asistencias${ruta}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  // null = la respuesta no es JSON (por ejemplo, una página HTML de error)
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    const error = new Error(data?.error || 'Ocurrió un error en el servidor.');
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Registrar entrada (Check-in) */
export const registrarEntrada = () => peticion('/check-in', 'POST');

/** Registrar salida (Check-out) */
export const registrarSalida = () => peticion('/check-out', 'POST');

/** Historial de asistencias del usuario autenticado */
export const obtenerMisAsistencias = () => peticion('/mis-registros');
