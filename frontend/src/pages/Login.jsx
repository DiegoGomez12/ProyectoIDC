import React, { useState } from 'react';
import { login, registrarUsuario } from '../api/auth';

export default function Login({ onLoginSuccess, onDemoAccess }) {
  // Pestaña activa: 'login' o 'registro'
  const [pestana, setPestana] = useState('login');

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados visuales
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);

  // Manejador del Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      const data = await login(email.trim(), password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setCargando(false);
    }
  };

  // Manejador del Registro
  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await registrarUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        password
      });

      // Registro exitoso: limpiar y cambiar a login con mensaje
      setMensajeExito('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
      setPestana('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarPestana = (nuevaPestana) => {
    setPestana(nuevaPestana);
    setError('');
    setMensajeExito('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 65px)',
      backgroundColor: '#f8fafc',
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Time<span style={{ color: '#2563eb' }}>Check</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sistema de Control de Asistencia y Registro de Jornada
          </p>
        </div>

        {/* Pestañas para alternar entre Iniciar Sesión y Registro */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          padding: '0.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => cambiarPestana('login')}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: pestana === 'login' ? '#ffffff' : 'transparent',
              color: pestana === 'login' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: pestana === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => cambiarPestana('registro')}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: pestana === 'registro' ? '#ffffff' : 'transparent',
              color: pestana === 'registro' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: pestana === 'registro' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Alerta de Éxito */}
        {mensajeExito && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            ✅ {mensajeExito}
          </div>
        )}

        {/* Formulario de Login */}
        {pestana === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {mostrarPassword ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                marginTop: '0.5rem',
                backgroundColor: cargando ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: cargando ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {cargando ? 'Iniciando sesión...' : 'Ingresar a TimeCheck'}
            </button>
          </form>
        ) : (
          /* Formulario de Registro de Nuevo Empleado */
          <form onSubmit={handleRegistroSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Juan Pérez"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="colaborador@empresa.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                  Contraseña (mínimo 8 caracteres)
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Al menos 8 caracteres"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Confirmar Contraseña
              </label>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Repite la contraseña"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                marginTop: '0.5rem',
                backgroundColor: cargando ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: cargando ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {cargando ? 'Creando cuenta...' : 'Registrarme como Empleado'}
            </button>
          </form>
        )}

        {/* Acceso de prueba rápido (solo en desarrollo) */}
        {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true') && (
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <button
              onClick={onDemoAccess}
              type="button"
              style={{
                width: '100%',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '0.65rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>⚡</span> [Dev] Acceso de prueba (Sin Base de Datos)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
