import React, { useCallback, useEffect, useState } from 'react';
import { obtenerMisAsistencias, registrarEntrada, registrarSalida } from '../api/asistencias';
import { formatearFecha, formatearHora, horasDeLaSemana } from '../utils/asistencias';

export default function Dashboard({ usuario, onLogout }) {
  const [registros, setRegistros] = useState([]);
  const [carga, setCarga] = useState('cargando'); // 'cargando' | 'lista' | 'error'
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(null);
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString());

  // El estado sale de los datos de la API: así sigue correcto aunque se recargue la página
  const tieneCheckInActivo = registros.some((r) => r.estatus === 'activo');
  const sesionExpirada = error?.status === 401;

  const cargarRegistros = useCallback(async () => {
    setCarga('cargando');
    setError(null);
    try {
      setRegistros(await obtenerMisAsistencias());
      setCarga('lista');
    } catch (err) {
      setError(err);
      setCarga('error');
    }
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Envía la marca y actualiza la tabla con el registro que devuelve la API
  const marcar = async (accion, textoExito) => {
    setEnviando(true);
    setMensaje('');
    setError(null);
    try {
      const registro = await accion();
      setRegistros((previos) => [registro, ...previos.filter((r) => r.id !== registro.id)]);
      setMensaje(textoExito(registro));
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  };

  const handleCheckIn = () =>
    marcar(registrarEntrada, (r) => `Entrada registrada a las ${formatearHora(r.hora_entrada)}`);

  const handleCheckOut = () =>
    marcar(registrarSalida, (r) =>
      `Salida registrada a las ${formatearHora(r.hora_salida)} (${r.horas_trabajadas} hrs)`);

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '2rem auto',
      padding: '0 1.5rem',
      paddingBottom: '3rem'
    }}>
      {/* Encabezado con hora actual */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            Hola, {usuario?.nombre || 'Colaborador'} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Panel de Asistencias & Control de Horas Laborales
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '0.65rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
            Hora Local
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
            {horaActual}
          </div>
        </div>
      </div>

      {mensaje && (
        <div style={{
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: '600',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>✨</span> {mensaje}
        </div>
      )}

      {error && (
        <div role="alert" style={{
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: '600',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <span>{sesionExpirada ? 'Tu sesión expiró o no es válida.' : error.message}</span>
          <button
            onClick={sesionExpirada ? onLogout : cargarRegistros}
            style={{
              backgroundColor: '#ffffff',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {sesionExpirada ? 'Iniciar sesión' : 'Reintentar'}
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Estado de Jornada
          </span>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: tieneCheckInActivo ? '#22c55e' : '#94a3b8'
            }}></span>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: tieneCheckInActivo ? '#15803d' : '#475569' }}>
              {tieneCheckInActivo ? 'En Turno Activo' : 'Fuera de Turno'}
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Horas Acumuladas
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginTop: '0.35rem' }}>
            {horasDeLaSemana(registros)} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>hrs esta semana</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
            Rol en Plataforma
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2563eb', textTransform: 'capitalize', marginTop: '0.35rem' }}>
            {usuario?.rol || 'Empleado'}
          </div>
        </div>
      </div>

      {/* Panel Central de Check-in / Check-out (Requisito de Pruebas Unitarias de Frontend) */}
      <div style={{
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
          Registro Rápido de Asistencia
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem', maxWidth: '500px', margin: '0 auto 1.75rem auto' }}>
          Haz clic en el botón para alternar tu marca de entrada o salida. El sistema calculará automáticamente tus horas trabajadas.
        </p>

        {/* Renderizado condicional estricto: Check-out solo visible/activo tras Check-in */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {carga === 'cargando' && <span>Cargando...</span>}

          {carga === 'lista' && (!tieneCheckInActivo ? (
            <button
              onClick={handleCheckIn}
              disabled={enviando}
              id="btn-checkin"
              style={{
                backgroundColor: '#16a34a',
                opacity: enviando ? 0.6 : 1,
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 2.25rem',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>📥</span> Registrar Entrada (Check-in)
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={enviando}
              id="btn-checkout"
              style={{
                backgroundColor: '#dc2626',
                opacity: enviando ? 0.6 : 1,
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 2.25rem',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>📤</span> Registrar Salida (Check-out)
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Registros Históricos */}
      <div style={{
        background: '#ffffff',
        padding: '1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem' }}>
          Historial de Marcas y Horas
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Fecha</th>
                <th style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Entrada</th>
                <th style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Salida</th>
                <th style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Horas</th>
                <th style={{ padding: '0.85rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {carga === 'lista' && registros.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '0.85rem', color: '#64748b' }}>Aún no tienes registros.</td>
                </tr>
              )}
              {registros.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.85rem', fontWeight: '600', color: '#1e293b' }}>{formatearFecha(r.hora_entrada)}</td>
                  <td style={{ padding: '0.85rem', color: '#16a34a', fontWeight: '500' }}>{formatearHora(r.hora_entrada)}</td>
                  <td style={{ padding: '0.85rem', color: '#dc2626', fontWeight: '500' }}>{formatearHora(r.hora_salida)}</td>
                  <td style={{ padding: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{r.horas_trabajadas === null ? '—' : `${r.horas_trabajadas} hrs`}</td>
                  <td style={{ padding: '0.85rem' }}>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {r.estatus === 'activo' ? 'En curso' : 'Completado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
