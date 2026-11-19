process.env.JWT_SECRET = 'secreto-de-prueba';
jest.mock('../src/models/asistencia.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Asistencia = require('../src/models/asistencia.model');

const tokenDe = (rol, id = 'u-test-1') => jwt.sign({ id, rol }, process.env.JWT_SECRET);

beforeEach(() => jest.resetAllMocks());

describe('POST /api/asistencias/check-in', () => {
  test('401 si no se envía token', async () => {
    const res = await request(app).post('/api/asistencias/check-in');
    expect(res.status).toBe(401);
  });

  test('201 registra entrada si no hay jornada activa previa', async () => {
    Asistencia.obtenerActivaPorUsuario.mockResolvedValue(null);
    Asistencia.registrarEntrada.mockResolvedValue({
      id: 'a1',
      usuario_id: 'u-test-1',
      hora_entrada: new Date().toISOString(),
      estatus: 'activo'
    });

    const res = await request(app)
      .post('/api/asistencias/check-in')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(201);
    expect(res.body.estatus).toBe('activo');
    expect(Asistencia.registrarEntrada).toHaveBeenCalledWith('u-test-1');
  });

  test('400 si ya cuenta con una jornada activa (regla de negocio)', async () => {
    Asistencia.obtenerActivaPorUsuario.mockResolvedValue({
      id: 'a-abierta',
      usuario_id: 'u-test-1',
      estatus: 'activo'
    });

    const res = await request(app)
      .post('/api/asistencias/check-in')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jornada activa sin registrar salida/i);
    expect(Asistencia.registrarEntrada).not.toHaveBeenCalled();
  });
});

describe('POST /api/asistencias/check-out', () => {
  test('401 si no se envía token', async () => {
    const res = await request(app).post('/api/asistencias/check-out');
    expect(res.status).toBe(401);
  });

  test('400 si intenta hacer check-out sin tener jornada activa previa (regla de negocio)', async () => {
    Asistencia.obtenerActivaPorUsuario.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/asistencias/check-out')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No cuentas con una jornada activa/i);
    expect(Asistencia.registrarSalida).not.toHaveBeenCalled();
  });

  test('200 registra salida y calcula horas trabajadas', async () => {
    Asistencia.obtenerActivaPorUsuario.mockResolvedValue({
      id: 'a-activa-99',
      usuario_id: 'u-test-1',
      estatus: 'activo'
    });

    Asistencia.registrarSalida.mockResolvedValue({
      id: 'a-activa-99',
      usuario_id: 'u-test-1',
      hora_entrada: '2026-11-17T09:00:00Z',
      hora_salida: '2026-11-17T17:00:00Z',
      estatus: 'completado',
      horas_trabajadas: 8.0
    });

    const res = await request(app)
      .post('/api/asistencias/check-out')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(200);
    expect(res.body.estatus).toBe('completado');
    expect(res.body.horas_trabajadas).toBe(8.0);
    expect(Asistencia.registrarSalida).toHaveBeenCalledWith('a-activa-99');
  });
});

describe('GET /api/asistencias/mis-registros', () => {
  test('200 devuelve lista de asistencias del usuario', async () => {
    Asistencia.obtenerPorUsuario.mockResolvedValue([
      { id: 'a1', horas_trabajadas: 8 },
      { id: 'a2', horas_trabajadas: 7.5 }
    ]);

    const res = await request(app)
      .get('/api/asistencias/mis-registros')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(Asistencia.obtenerPorUsuario).toHaveBeenCalledWith('u-test-1');
  });
});

describe('GET /api/asistencias/estado', () => {
  test('200 indica si tiene check-in activo', async () => {
    Asistencia.obtenerActivaPorUsuario.mockResolvedValue({ id: 'a1', estatus: 'activo' });

    const res = await request(app)
      .get('/api/asistencias/estado')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(200);
    expect(res.body.tieneCheckInActivo).toBe(true);
  });
});

describe('GET /api/asistencias (supervisión admin)', () => {
  test('403 para usuarios con rol empleado', async () => {
    const res = await request(app)
      .get('/api/asistencias')
      .set('Authorization', `Bearer ${tokenDe('empleado')}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Requiere rol admin/i);
  });

  test('200 para usuarios con rol admin', async () => {
    Asistencia.listar.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/asistencias')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
