import { describe, expect, test } from 'vitest';
import { formatearHora, horasDeLaSemana, inicioDeSemana } from './asistencias';

// new Date(año, mes, día, hora) usa la hora local, así la prueba da igual en cualquier zona horaria
const dia = (d, h = 9) => new Date(2026, 10, d, h);
const MIERCOLES = dia(25);

describe('inicioDeSemana', () => {
  test('devuelve el lunes a las 00:00', () => {
    expect(inicioDeSemana(MIERCOLES)).toEqual(new Date(2026, 10, 23));
  });

  test('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(inicioDeSemana(dia(29))).toEqual(new Date(2026, 10, 23));
  });
});

describe('horasDeLaSemana', () => {
  test('suma solo las jornadas de esta semana e ignora la activa', () => {
    const registros = [
      { hora_entrada: dia(25).toISOString(), horas_trabajadas: null }, // activa
      { hora_entrada: dia(24).toISOString(), horas_trabajadas: 7.25 },
      { hora_entrada: dia(23).toISOString(), horas_trabajadas: 8.5 },
      { hora_entrada: dia(22).toISOString(), horas_trabajadas: 5 }, // domingo: semana pasada
    ];
    expect(horasDeLaSemana(registros, MIERCOLES)).toBe(15.75);
  });

  test('sin registros da 0', () => {
    expect(horasDeLaSemana([], MIERCOLES)).toBe(0);
  });
});

test('formatearHora muestra un guion si todavía no hay salida', () => {
  expect(formatearHora(null)).toBe('—');
});
