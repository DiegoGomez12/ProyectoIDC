const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Obtener cabeceras de autorización con JWT
 */
function getAuthHeaders() {
  const token = localStorage.getItem('timecheck_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Registrar Check-in (Entrada)
 */
export async function registrarEntrada() {
  const response = await fetch(`${API_URL}/api/asistencias/check-in`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al registrar entrada');
  return data;
}

/**
 * Registrar Check-out (Salida)
 */
export async function registrarSalida() {
  const response = await fetch(`${API_URL}/api/asistencias/check-out`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al registrar salida');
  return data;
}

/**
 * Obtener historial de asistencias del usuario activo
 */
export async function obtenerMisAsistencias() {
  const response = await fetch(`${API_URL}/api/asistencias/mis-registros`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener registros');
  return data;
}
