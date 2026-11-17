import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Recuperar usuario guardado en sesión
    const savedUser = localStorage.getItem('timecheck_user');
    if (savedUser) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('timecheck_user');
      }
    }
  }, []);

  const handleLoginSuccess = (data) => {
    if (data.token) {
      localStorage.setItem('timecheck_token', data.token);
    }
    if (data.usuario) {
      localStorage.setItem('timecheck_user', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('timecheck_token');
    localStorage.removeItem('timecheck_user');
    setUsuario(null);
  };

  // Acceso rápido directo para probar el Dashboard
  const handleDemoAccess = () => {
    const demoUser = {
      id: 'demo-456',
      nombre: 'Usuario de prueba',
      email: 'prueba@timecheck.com',
      rol: 'empleado'
    };
    localStorage.setItem('timecheck_user', JSON.stringify(demoUser));
    setUsuario(demoUser);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar usuario={usuario} onLogout={handleLogout} />

      {!usuario ? (
        <Login onLoginSuccess={handleLoginSuccess} onDemoAccess={handleDemoAccess} />
      ) : (
        <Dashboard usuario={usuario} />
      )}
    </div>
  );
}
