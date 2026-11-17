import React from 'react';

export default function Navbar({ usuario, onLogout }) {
  return (
    <nav style={{
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '0.85rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
        }}>
          ⏱️
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.3px' }}>
          Time<span style={{ color: '#60a5fa' }}>Check</span>
        </span>
      </div>

      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f1f5f9' }}>
              {usuario.nombre}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
              Rol: {usuario.rol}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}
