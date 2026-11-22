const { calcularHoras } = require('../src/utils/tiempo');

describe('calcularHoras', () => {
  test('jornada normal de 8 horas', () => {
    expect(calcularHoras('2026-11-17T09:00:00Z', '2026-11-17T17:00:00Z')).toBe(8);
  });

  test('redondea a 2 decimales (7 h 20 min = 7.33)', () => {
    expect(calcularHoras('2026-11-17T09:00:00Z', '2026-11-17T16:20:00Z')).toBe(7.33);
  });

  test('entrada y salida en el mismo instante = 0 horas', () => {
    expect(calcularHoras('2026-11-17T09:00:00Z', '2026-11-17T09:00:00Z')).toBe(0);
  });

  test('marcas con distinta zona horaria se comparan como el mismo instante', () => {
    // 09:00 en Ciudad de México (UTC-6) son las 15:00 UTC → hasta las 17:30 UTC hay 2.5 h
    expect(calcularHoras('2026-11-17T09:00:00-06:00', '2026-11-17T17:30:00Z')).toBe(2.5);
  });

  test('jornada nocturna que cruza la medianoche', () => {
    expect(calcularHoras('2026-11-17T22:00:00-06:00', '2026-11-18T06:00:00-06:00')).toBe(8);
  });

  test('cambio de horario de verano: cuenta las horas reales, no las del reloj', () => {
    // Nueva York adelantó el reloj 1 h el 8 de marzo de 2026 (EST -05:00 → EDT -04:00).
    // En el reloj parecen 8 h (00:00 → 08:00), pero solo pasaron 7 h reales.
    expect(calcularHoras('2026-03-08T00:00:00-05:00', '2026-03-08T08:00:00-04:00')).toBe(7);
  });

  test('acepta objetos Date, como los devuelve pg', () => {
    const entrada = new Date('2026-11-17T15:00:00Z');
    const salida = new Date('2026-11-17T23:45:00Z');
    expect(calcularHoras(entrada, salida)).toBe(8.75);
  });

  test('error si la salida es anterior a la entrada', () => {
    expect(() => calcularHoras('2026-11-17T17:00:00Z', '2026-11-17T09:00:00Z'))
      .toThrow(/anterior a la entrada/);
  });

  test('error si alguna fecha no es válida', () => {
    expect(() => calcularHoras('no-es-fecha', '2026-11-17T09:00:00Z')).toThrow(/inválida/);
  });

  test('error si falta la salida (jornada activa)', () => {
    // Sin esta validación, new Date(null) sería 1970 y daría un número sin sentido
    expect(() => calcularHoras('2026-11-17T09:00:00Z', null)).toThrow(/Se requieren/);
  });
});