/** Lunes a las 00:00 (hora local) de la semana de la fecha dada */
export function inicioDeSemana(fecha = new Date()) {
  const lunes = new Date(fecha);
  lunes.setHours(0, 0, 0, 0);
  // getDay(): domingo = 0, lunes = 1 ... Se recorre para que el lunes sea el día 0
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return lunes;
}

/** Suma las horas de las jornadas que empezaron esta semana (las activas aún no cuentan) */
export function horasDeLaSemana(registros, hoy = new Date()) {
  const lunes = inicioDeSemana(hoy);
  const total = registros
    .filter((r) => new Date(r.hora_entrada) >= lunes)
    .reduce((suma, r) => suma + (r.horas_trabajadas ?? 0), 0);
  return Math.round(total * 100) / 100;
}

// La API manda las fechas en UTC; el navegador las convierte a la hora local del usuario
export const formatearFecha = (iso) => new Date(iso).toLocaleDateString('es-MX');

export const formatearHora = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';
