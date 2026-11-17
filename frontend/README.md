# Frontend – TimeCheck Web SPA

Aplicación de interfaz de usuario Single Page Application (SPA) desarrollada con **React.js** y **Vite**, optimizada para ejecutarse en contenedores Docker mediante **Nginx Alpine**.

---

## 📌 Relación con los Issues del Proyecto

Esta base proporciona la arquitectura inicial para que el equipo pueda continuar con la **Fase 4** del proyecto:

* **Issue #2 (Infraestructura):** Dockerfile multi-stage (`node:20-alpine` para build y `nginx:alpine` para runtime) y configuración de servidor Nginx para rutas SPA (`nginx.conf`).
* **Base para Issue #9 (Autenticación / Login):** Vistas y servicios en `src/pages/Login.jsx` y `src/api/auth.js` listos para conectarse al endpoint `/api/auth/login` y `/api/usuarios`.
* **Base para Issue #10 (Dashboard Asistencias):** Vista en `src/pages/Dashboard.jsx` con panel de registro de jornada, alternancia condicional de botones (Check-in / Check-out) y tabla de resumen de horas trabajadas.

---

## 📂 Estructura del Frontend

```text
frontend/
├── Dockerfile           # Multi-stage build optimizado para producción (~90 MB)
├── nginx.conf           # Servidor Nginx con soporte para rutas SPA (try_files)
├── .dockerignore        # Exclusión de node_modules, dist y archivos innecesarios
├── index.html           # Punto de entrada HTML
├── vite.config.js       # Configuración de Vite y React
├── package.json         # Dependencias y scripts
└── src/
    ├── api/
    │   ├── auth.js          # Consumo de endpoints de login y registro
    │   └── asistencias.js   # Esqueleto para endpoints de check-in / check-out
    ├── components/
    │   └── Navbar.jsx       # Barra de navegación con usuario activo y logout
    ├── pages/
    │   ├── Login.jsx        # Formulario de inicio de sesión
    │   └── Dashboard.jsx    # Panel con Check-in / Check-out y horas
    ├── App.jsx              # Coordinador de sesión y vistas
    └── main.jsx             # Montaje de React en el DOM
```

---

## 🛠️ Ejecución en Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo (puerto 5173):
   ```bash
   npm run dev
   ```
3. Compilar versión estática de producción:
   ```bash
   npm run build
   ```

---

## 🐳 Ejecución con Docker

### Compilar la imagen:
```bash
docker build -t timecheck-frontend:latest ./frontend
```

### Ejecutar el contenedor:
```bash
docker run -d -p 8080:80 --name timecheck-web timecheck-frontend:latest
```
Acceder en el navegador a `http://localhost:8080`.

---

## 🌐 Variables de Entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend Node.js | `http://localhost:3000` |
