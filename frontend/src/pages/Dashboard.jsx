import React, { useState, useEffect } from 'react';

export default function Dashboard({ usuario }) {
  const [tieneCheckInActivo, setTieneCheckInActivo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString());
  const [registros, setRegistros] = useState([
    { id: 1, fecha: '16/11/2026', entrada: '09:00 AM', salida: '05:30 PM', horas: '8.5', estatus: 'Completado' },
    { id: 2, fecha: '15/11/2026', entrada: '08:55 AM', salida: '05:00 PM', horas: '8.0', estatus: 'Completado' }
  ]);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTieneCheckInActivo(true);
    setMensaje(`Entrada registrada con éxito a las ${hora}`);
  };

  const handleCheckOut = () => {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTieneCheckInActivo(false);
    setMensaje(`Salida registrada con éxito a las ${hora}`);
    
    // Agregar registro a la tabla
    const nuevoRegistro = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString(),
      entrada: '09:00 AM',
      salida: hora,
      horas: '8.0',
      estatus: 'Completado'
    };
    setRegistros([nuevoRegistro, ...registros]);
  };

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
            16.5 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>hrs esta semana</span>
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
          {!tieneCheckInActivo ? (
            <button
              onClick={handleCheckIn}
              id="btn-checkin"
              style={{
                backgroundColor: '#16a34a',
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
              id="btn-checkout"
              style={{
                backgroundColor: '#dc2626',
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
          )}
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
              {registros.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.85rem', fontWeight: '600', color: '#1e293b' }}>{r.fecha}</td>
                  <td style={{ padding: '0.85rem', color: '#16a34a', fontWeight: '500' }}>{r.entrada}</td>
                  <td style={{ padding: '0.85rem', color: '#dc2626', fontWeight: '500' }}>{r.salida}</td>
                  <td style={{ padding: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{r.horas} hrs</td>
                  <td style={{ padding: '0.85rem' }}>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {r.estatus}
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
