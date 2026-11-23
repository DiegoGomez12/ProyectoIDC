import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { obtenerMisAsistencias, registrarEntrada } from './asistencias';

const responder = (cuerpo, status = 200) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(cuerpo, { status })));

beforeEach(() => localStorage.setItem('timecheck_token', 'token-123'));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('peticiones a /api/asistencias', () => {
  test('envía el token y devuelve el JSON', async () => {
    responder('[{"id":"a1"}]');

    expect(await obtenerMisAsistencias()).toEqual([{ id: 'a1' }]);

    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/asistencias\/mis-registros$/);
    expect(opciones.headers.Authorization).toBe('Bearer token-123');
  });

  test('si la API rechaza la petición, pasa su mensaje y el código HTTP', async () => {
    responder('{"error":"Ya cuentas con una jornada activa"}', 400);
    await expect(registrarEntrada()).rejects.toMatchObject({ message: 'Ya cuentas con una jornada activa', status: 400 });
  });

  test('error con HTML (502 de Azure) da un mensaje entendible', async () => {
    responder('<html>Bad Gateway</html>', 502);
    await expect(obtenerMisAsistencias()).rejects.toMatchObject({ message: 'Ocurrió un error en el servidor.', status: 502 });
  });

  test('una respuesta 200 que no es JSON también es error (VITE_API_URL mal configurada)', async () => {
    responder('<html>index</html>', 200);
    await expect(obtenerMisAsistencias()).rejects.toThrow('Ocurrió un error en el servidor.');
  });

  test('sin conexión da un mensaje entendible en cualquier navegador', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); })); // Safari
    await expect(obtenerMisAsistencias()).rejects.toThrow('No se pudo conectar con el servidor.');
  });
});
