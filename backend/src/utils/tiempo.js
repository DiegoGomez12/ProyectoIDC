/**
 * Calcula las horas trabajadas entre dos marcas de tiempo.
 *
 * Acepta objetos Date (como los devuelve `pg` para columnas TIMESTAMPTZ)
 * o strings ISO 8601 con zona horaria (ej. '2026-11-17T09:00:00-06:00').
 *
 * La resta se hace entre instantes absolutos (UTC), por eso el resultado no
 * depende de la zona horaria del servidor ni de los cambios de horario de verano.
 */
function calcularHoras(entrada, salida) {
  if (!entrada || !salida) {
    throw new Error('Se requieren la hora de entrada y la de salida');
  }

  const inicio = new Date(entrada);
  const fin = new Date(salida);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw new Error('Fecha inválida');
  }
  if (fin < inicio) {
    throw new Error('La salida no puede ser anterior a la entrada');
  }

  const horas = (fin - inicio) / (1000 * 60 * 60);
  return Math.round(horas * 100) / 100; // 2 decimales
}

module.exports = { calcularHoras };