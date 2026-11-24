jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const pool = require('../src/config/db');
const Asistencia = require('../src/models/asistencia.model');

beforeEach(() => jest.resetAllMocks());

describe('Modelo de asistencias: horas trabajadas', () => {
  test('obtenerPorUsuario devuelve horas como número y null en jornadas activas', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 'a1', hora_entrada: new Date('2026-11-17T15:00:00Z'), hora_salida: new Date('2026-11-17T23:30:00Z'), estatus: 'completado' },
        { id: 'a2', hora_entrada: new Date('2026-11-18T15:00:00Z'), hora_salida: null, estatus: 'activo' },
      ],
    });

    const registros = await Asistencia.obtenerPorUsuario('u1');

    expect(registros[0].horas_trabajadas).toBe(8.5);
    expect(typeof registros[0].horas_trabajadas).toBe('number');
    expect(registros[1].horas_trabajadas).toBeNull();
  });

  test('registrarSalida calcula las horas de la jornada que se cierra', async () => {
    pool.query.mockResolvedValue({
      rows: [{
        id: 'a1',
        hora_entrada: new Date('2026-11-17T09:00:00-06:00'),
        hora_salida: new Date('2026-11-17T13:45:00-06:00'),
        estatus: 'completado',
      }],
    });

    const registro = await Asistencia.registrarSalida('a1');

    expect(registro.horas_trabajadas).toBe(4.75);
  });

  test('registrarEntrada deja horas_trabajadas en null', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 'a1', hora_entrada: new Date(), hora_salida: null, estatus: 'activo' }],
    });

    const registro = await Asistencia.registrarEntrada('u1');

    expect(registro.horas_trabajadas).toBeNull();
  });
});