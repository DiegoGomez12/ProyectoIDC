const { identificarUsuario } = require('../src/utils/telemetria');

describe('identificarUsuario', () => {
  test('marca la petición solo con el id y el rol (sin datos personales)', () => {
    const span = { setAttributes: jest.fn() };
    const req = {
      usuario: { id: 'u1', rol: 'empleado', nombre: 'Ana', email: 'ana@test.com' },
      headers: { authorization: 'Bearer token' },
    };

    identificarUsuario(span, req);

    expect(span.setAttributes).toHaveBeenCalledTimes(1);
    expect(span.setAttributes).toHaveBeenCalledWith({
      'enduser.pseudo.id': 'u1',
      'timecheck.rol': 'empleado',
    });
  });

  test('sin sesión no marca nada (login, /health, token inválido)', () => {
    const span = { setAttributes: jest.fn() };

    identificarUsuario(span, {});

    expect(span.setAttributes).not.toHaveBeenCalled();
  });
});