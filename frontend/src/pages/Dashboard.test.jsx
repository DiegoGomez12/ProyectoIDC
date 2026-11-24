import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { obtenerMisAsistencias, registrarEntrada, registrarSalida } from '../api/asistencias';

vi.mock('../api/asistencias');

const usuario = { id: 'u1', nombre: 'Ana', rol: 'empleado' };

const activa = {
  id: 'a1',
  hora_entrada: '2026-11-23T15:00:00Z',
  hora_salida: null,
  estatus: 'activo',
  horas_trabajadas: null,
};
const completada = {
  ...activa,
  hora_salida: '2026-11-23T23:30:00Z',
  estatus: 'completado',
  horas_trabajadas: 8.5,
};

const botonEntrada = () => screen.queryByRole('button', { name: /check-in/i });
const botonSalida = () => screen.queryByRole('button', { name: /check-out/i });

const mostrarDashboard = async (props = {}) => {
  render(<Dashboard usuario={usuario} onLogout={() => {}} {...props} />);
  await screen.findByText(/historial de marcas/i);
  // Espera a que termine la carga inicial
  await vi.waitFor(() => expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument());
};

beforeEach(() => {
  vi.resetAllMocks();
  obtenerMisAsistencias.mockResolvedValue([]);
});

describe('Botones de Entrada/Salida', () => {
  test('sin jornada activa solo muestra Check-in', async () => {
    await mostrarDashboard();
    expect(botonEntrada()).toBeInTheDocument();
    expect(botonSalida()).not.toBeInTheDocument();
  });

  test('con jornada activa solo muestra Check-out', async () => {
    obtenerMisAsistencias.mockResolvedValue([activa]);
    await mostrarDashboard();
    expect(botonSalida()).toBeInTheDocument();
    expect(botonEntrada()).not.toBeInTheDocument();
  });

  test('Check-out aparece solo después de un Check-in exitoso', async () => {
    registrarEntrada.mockResolvedValue(activa);
    await mostrarDashboard();

    await userEvent.click(botonEntrada());

    expect(await screen.findByRole('button', { name: /check-out/i })).toBeInTheDocument();
    expect(botonEntrada()).not.toBeInTheDocument();
    expect(registrarEntrada).toHaveBeenCalledTimes(1);
  });

  test('si el Check-in falla, muestra el error y no aparece Check-out', async () => {
    registrarEntrada.mockRejectedValue(new Error('No se pudo conectar con el servidor.'));
    await mostrarDashboard();

    await userEvent.click(botonEntrada());

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar/i);
    expect(botonSalida()).not.toBeInTheDocument();
    expect(botonEntrada()).toBeEnabled();
  });

  test('tras el Check-out vuelve a mostrar Check-in y las horas de la API', async () => {
    obtenerMisAsistencias.mockResolvedValue([activa]);
    registrarSalida.mockResolvedValue(completada);
    await mostrarDashboard();

    await userEvent.click(botonSalida());

    expect(await screen.findByRole('button', { name: /check-in/i })).toBeInTheDocument();
    expect(botonSalida()).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '8.5 hrs' })).toBeInTheDocument();
  });

  test('el botón se bloquea mientras espera la respuesta (evita doble clic)', async () => {
    registrarEntrada.mockReturnValue(new Promise(() => {})); // nunca responde
    await mostrarDashboard();

    await userEvent.click(botonEntrada());

    expect(botonEntrada()).toBeDisabled();
  });
});

describe('Carga del historial', () => {
  test('muestra un aviso cuando no hay registros', async () => {
    await mostrarDashboard();
    expect(screen.getByText(/aún no tienes registros/i)).toBeInTheDocument();
  });

  test('si no se puede cargar, no ofrece marcar y permite reintentar', async () => {
    obtenerMisAsistencias.mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'));
    await mostrarDashboard();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(botonEntrada()).not.toBeInTheDocument();
    expect(botonSalida()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByRole('button', { name: /check-in/i })).toBeInTheDocument();
  });

  test('si la sesión expiró (401) pide volver a iniciar sesión', async () => {
    obtenerMisAsistencias.mockRejectedValue(Object.assign(new Error('Token inválido'), { status: 401 }));
    const onLogout = vi.fn();
    await mostrarDashboard({ onLogout });

    expect(screen.getByRole('alert')).toHaveTextContent(/sesión expiró/i);
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(onLogout).toHaveBeenCalled();
  });
});
