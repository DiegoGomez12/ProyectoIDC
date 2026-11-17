process.env.JWT_SECRET = 'secreto-de-prueba';
jest.mock('../src/models/usuario.model');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const Usuario = require('../src/models/usuario.model');

const tokenDe = (rol, id = 'u1') => jwt.sign({ id, rol }, process.env.JWT_SECRET);
beforeEach(() => jest.resetAllMocks());

describe('POST /api/usuarios', () => {
  test('crea el usuario con la contraseña cifrada', async () => {
    Usuario.crear.mockResolvedValue({ id: 'u1', nombre: 'Ana', email: 'ana@test.com', rol: 'empleado' });
    const res = await request(app).post('/api/usuarios')
      .send({ nombre: 'Ana', email: 'ana@test.com', password: '12345678' });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password_hash');
    const { passwordHash } = Usuario.crear.mock.calls[0][0];
    expect(passwordHash).not.toBe('12345678');
    expect(await bcrypt.compare('12345678', passwordHash)).toBe(true);
  });

  test('400 si faltan campos', async () => {
    const res = await request(app).post('/api/usuarios').send({ email: 'ana@test.com' });
    expect(res.status).toBe(400);
  });

  test('409 si el email ya existe', async () => {
    Usuario.crear.mockRejectedValue(Object.assign(new Error('duplicado'), { code: '23505' }));
    const res = await request(app).post('/api/usuarios')
      .send({ nombre: 'Ana', email: 'ana@test.com', password: '12345678' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/usuarios (solo admin)', () => {
  test('401 sin token', async () => {
    expect((await request(app).get('/api/usuarios')).status).toBe(401);
  });
  test('403 con rol empleado', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenDe('empleado')}`);
    expect(res.status).toBe(403);
  });
  test('200 con rol admin', async () => {
    Usuario.listar.mockResolvedValue([]);
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenDe('admin')}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/login', () => {
  const usuarioBD = async () => ({
    id: 'u1', nombre: 'Ana', email: 'ana@test.com', rol: 'empleado',
    password_hash: await bcrypt.hash('12345678', 4),
  });

  test('devuelve un JWT válido con credenciales correctas', async () => {
    Usuario.obtenerPorEmailConPassword.mockResolvedValue(await usuarioBD());
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@test.com', password: '12345678' });

    expect(res.status).toBe(200);
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET)).toMatchObject({ id: 'u1', rol: 'empleado' });
    expect(res.body.usuario).not.toHaveProperty('password_hash');
  });

  test('401 con contraseña incorrecta', async () => {
    Usuario.obtenerPorEmailConPassword.mockResolvedValue(await usuarioBD());
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@test.com', password: 'otra-cosa' });
    expect(res.status).toBe(401);
  });
});