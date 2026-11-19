# Frontend – TimeCheck Web SPA

Aplicación de interfaz de usuario Single Page Application (SPA) desarrollada con **React.js** y **Vite**, optimizada para ejecutarse en contenedores Docker mediante **Nginx Alpine**.

---

## 📌 Relación con los Issues del Proyecto y Alcance

Esta base proporciona la arquitectura inicial para que el equipo pueda continuar con la **Fase 4** del proyecto sin cerrar prematuramente los issues funcionales:

* **Issue #2 (Infraestructura):** Dockerfile multi-stage (`node:24-alpine` para build y `nginx:alpine` para runtime) con soporte de inyección de `VITE_API_URL`, instalación reproducible vía `npm ci`, y configuración de servidor Nginx para rutas SPA (`nginx.conf`).
* **Issue #9 (Autenticación / Login - Implementado):** Módulo completo de autenticación con selector de pestañas (Iniciar Sesión y Crear Cuenta de Empleado), validaciones de cliente (email, longitud mínima de 8 caracteres y confirmación de contraseña), visibilidad toggle de password, manejo de estado de carga, alertas de error y persistencia de sesión JWT en `localStorage`.
* **Base para Issue #10 (Dashboard Asistencias):** Vista en `src/pages/Dashboard.jsx` con panel de registro de jornada y tabla de horas.  
  > ⚠️ **Nota de alcance:** El Dashboard actualmente utiliza **datos de ejemplo simulados** (no llama a la API real de asistencias) y **no cuenta todavía con pruebas unitarias en React Testing Library**. La suite de pruebas y la integración completa con la API corresponden al **Issue #10**, el cual permanece abierto.

---

## 📂 Estructura del Frontend

```text
frontend/
├── Dockerfile           # Multi-stage build optimizado para producción (~90 MB)
├── nginx.conf           # Servidor Nginx con soporte para rutas SPA (try_files)
├── .dockerignore        # Exclusión de node_modules, dist y archivos innecesarios
├── index.html           # Punto de entrada HTML con fuentes modernas (Plus Jakarta Sans / Inter)
├── vite.config.js       # Configuración de Vite y React
├── package.json         # Dependencias y scripts
├── package-lock.json    # Árbol de dependencias bloqueado para npm ci
└── src/
    ├── api/
    │   ├── auth.js          # Consumo de endpoints de login y registro
    │   └── asistencias.js   # Esqueleto de rutas para check-in / check-out
    ├── components/
    │   └── Navbar.jsx       # Barra de navegación con usuario activo y logout
    ├── pages/
    │   ├── Login.jsx        # Formulario de inicio de sesión (botón demo condicionado a dev)
    │   └── Dashboard.jsx    # Panel con Check-in / Check-out interactivo
    ├── App.jsx              # Coordinador de sesión y vistas
    └── main.jsx             # Montaje de React en el DOM
```

---

## 🛠️ Ejecución en Desarrollo Local

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Iniciar servidor de desarrollo con Hot-Reload (puerto 5173):
   ```bash
   npm run dev
   ```
3. Compilar versión estática de producción:
   ```bash
   npm run build
   ```

---

## 🐳 Ejecución con Docker

### 1. Compilar la imagen:
Por defecto apunta a `http://localhost:3000`:
```bash
docker build -t timecheck-frontend:latest ./frontend
```

Para compilar apuntando a una URL de backend específica (ej. en Azure o ambiente de pruebas):
```bash
docker build --build-arg VITE_API_URL=https://mi-api-azure.azurewebsites.net -t timecheck-frontend:latest ./frontend
```

### 2. Ejecutar el contenedor:
```bash
docker run -d -p 8080:80 --name timecheck-web timecheck-frontend:latest
```
Acceder en el navegador a `http://localhost:8080`.

---

## Variables de Entorno y Build Args

| Variable / Build Arg | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API Backend inyectada durante el build | `http://localhost:3000` |
| `VITE_ENABLE_DEMO` | Permite habilitar el botón de demo en producción si es `true` | `false` (oculto en producción) |
