# Backend – API TimeCheck

API REST en Node.js + Express para la gestión de usuarios y asistencias.
Origen: Issue #4

## ¿Cómo lo levanto?
1. Crear `.env` en la raíz del repo con las variables de [la base de datos](../Docs/entorno-desarrollo-local.md) y las de [abajo](#variables-de-entorno).
2. Base de datos local, desde la raíz: `docker compose up -d`
3. `cd backend && npm install`
4. `npm run db:init`: crea las tablas (se puede correr varias veces; usa `IF NOT EXISTS`).
5. `npm run dev`: servidor con recarga automática → `http://localhost:3000/health`
6. `npm test`: pruebas (no necesitan base de datos).

## Ejecución con Docker (Issue #2)
El backend cuenta con un `Dockerfile` multi-stage optimizado (`node:24-alpine`, solo dependencias de producción y usuario no privilegiado `node`). Al iniciar el contenedor ejecuta automáticamente `node src/db/init.js && exec node src/server.js`, asegurando de forma idempotente las tablas e índices antes de arrancar Express.

```bash
# Desde la raíz del repositorio
docker build -t timecheck-api ./backend
docker run --rm -p 3000:3000 --env-file .env -e DB_HOST=host.docker.internal timecheck-api
```

`DB_HOST=host.docker.internal` permite que el contenedor llegue al Postgres de `docker compose` que corre en tu máquina. Probar salud de la API: `http://localhost:3000/health`.

## Estructura
```text
backend/
├── src/
│   ├── app.js           # Configura Express (sin listen, para poder probarlo con Supertest)
│   ├── server.js        # Arranca el servidor
│   ├── config/env.js       # Carga el .env de la raíz del repo
│   ├── config/db.js        # Pool de conexiones a PostgreSQL
│   ├── config/telemetry.js # Monitoreo con Azure (solo si hay connection string)
│   ├── db/
│   │   ├── schema.sql   # Definición de tablas
│   │   └── init.js      # Aplica schema.sql (npm run db:init)
│   ├── models/          # Consultas SQL (nunca devuelven password_hash, salvo para login)
│   ├── controllers/     # Lógica de cada endpoint y validaciones
│   ├── middlewares/     # autenticar (JWT) y soloAdmin (rol)
│   ├── routes/          # URL → middleware → controlador
│   └── utils/           # Funciones puras (cálculo de horas trabajadas)
└── tests/               # Pruebas con Jest + Supertest (el modelo se simula)
```

## Endpoints

### Usuarios y Autenticación
| Método | Ruta | Quién | Qué hace |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/usuarios` | Público | Registro; siempre crea con rol empleado |
| `POST` | `/api/auth/login` | Público | Devuelve `{ token, usuario }` |
| `GET` | `/api/usuarios` | Admin | Lista todos |
| `GET` | `/api/usuarios/:id` | Admin o el mismo usuario | Obtiene uno |
| `PUT` | `/api/usuarios/:id` | Admin o el mismo usuario | Edita (solo el admin puede cambiar rol) |
| `DELETE` | `/api/usuarios/:id` | Admin | Elimina |

### Asistencias (Issue #5)
| Método | Ruta | Quién | Qué hace |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/asistencias/check-in` | Autenticado | Registra entrada (`horas_trabajadas: null`). Error 400 si ya existe jornada activa sin check-out |
| `POST` | `/api/asistencias/check-out` | Autenticado | Registra salida y devuelve `horas_trabajadas` como número (`number`). Error 400 si no hay jornada activa |
| `GET` | `/api/asistencias/mis-registros` | Autenticado | Devuelve el historial propio de asistencias y horas trabajadas |
| `GET` | `/api/asistencias/estado` | Autenticado | Devuelve `{ tieneCheckInActivo, registroActivo }` para el frontend |
| `GET` | `/api/asistencias` | Admin | Lista general de asistencias (filtros opcionales: `?fecha=YYYY-MM-DD`, `?usuarioId=UUID`) |

#### Ejemplos de respuesta
```json
// POST /api/auth/login (200 OK)
{
  "token": "<JWT>",
  "usuario": { "id": "uuid", "nombre": "Diego", "email": "diego@timecheck.com", "rol": "empleado", "creado_en": "2026-11-24T00:00:00.000Z" }
}

// POST /api/asistencias/check-out (200 OK)
{
  "id": "uuid",
  "usuario_id": "uuid",
  "hora_entrada": "2026-11-24T15:00:00.000Z",
  "hora_salida": "2026-11-24T23:30:00.000Z",
  "estatus": "completado",
  "horas_trabajadas": 8.5
}
```

### Crear el primer admin
El registro siempre crea usuarios `empleado`. Para tener el primer admin, registra un usuario normal y cámbiale el rol en la base:

```bash
docker exec -it timecheck-db-local psql -U <USUARIO> -d <BASE_DE_DATOS> -c "UPDATE usuarios SET rol='admin' WHERE email='tu@correo.com';"
```

## Decisiones técnicas
- **Express 5:** los errores de funciones `async` llegan solos al manejador central de errores.
- **`pg` sin ORM:** SQL explícito y menos dependencias; el esquema vive en `src/db/schema.sql`.
- **`app.js` separado de `server.js`:** Supertest prueba la app sin abrir un puerto.
- **El `.env` vive en la raíz:** lo comparten Docker Compose y el backend; `config/env.js` lo busca ahí. Si no existe (por ejemplo, en Docker), se usan las variables del entorno.
- **`DB_SSL`:** `false` en local y `true` en Azure, porque Azure exige SSL.
- **Modelo simulado (mock) en pruebas:** los tests no dependen de PostgreSQL, así el CI corre sin base de datos.
- **`bcryptjs`:** cifra contraseñas sin compilar código nativo (funciona igual en Windows y en Alpine/Docker).
- **JWT con `{ id, rol }`:** `autenticar` valida el token y `soloAdmin` restringe por rol.
- **Login con mensaje genérico:** si falla el email o la contraseña se responde igual ("Credenciales inválidas"), para no revelar qué emails existen.
- **Registro siempre como `empleado`:** solo un admin puede cambiar roles.
- **Horas calculadas en JS (`src/utils/tiempo.js`), no en SQL:** se prueba con Jest sin base de datos, siempre devuelve un número (Postgres `NUMERIC` llega a Node como texto) y resta instantes UTC, así que no la afectan las zonas horarias ni el horario de verano.
- **Una sola jornada activa por usuario, garantizado por la BD:** índice único parcial en `asistencias`; si llegan dos check-in al mismo tiempo, el segundo responde 400.

## Variables de entorno
Se agregan al mismo `.env` de la raíz que usa Docker Compose.

```dotenv
DB_HOST=localhost          # "localhost" si corres la API fuera de Docker
DB_SSL=false               # true solo contra Azure (exige SSL)
PORT=3000
NODE_ENV=development
JWT_SECRET=cambiar_por_un_secreto_largo
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
```

| Variable | Uso |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_SSL` | Conexión a PostgreSQL |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Credenciales de la BD (las mismas del compose) |
| `PORT` | Puerto de la API |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del token  |
| `CLIENT_URL` | Origen permitido por CORS (frontend) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Conexión a Application Insights (definida por Terraform en Azure; no se usa en local) |

## Pruebas
`npm test` corre toda la suite con Jest + Supertest, sin base de datos (el modelo o el pool se simulan). Para generar el reporte completo de cobertura (igual que en CI):

```bash
npx jest --coverage --collectCoverageFrom='src/**/*.js'
```

| Archivo | Qué cubre |
|---|---|
| `tests/health.test.js` | Endpoint `/health` |
| `tests/usuarios.test.js` | Registro, permisos por rol y login con JWT |
| `tests/asistencias.test.js` | Check-in / check-out y reglas de negocio (no doble entrada, no salida sin entrada) |
| `tests/asistencia.model.test.js` | El modelo devuelve `horas_trabajadas` como número, o `null` si la jornada sigue activa |
| `tests/tiempo.test.js` | Cálculo de horas: redondeo, zonas horarias, medianoche, horario de verano y errores (Issue #6) |

## Seguridad de dependencias (`npm audit`)
`@azure/monitor-opentelemetry` arrastra de forma transitiva 2 avisos moderados en `@opentelemetry/instrumentation-http` (`GHSA-3v2p-hm54-8qcq`), relacionados con credenciales enviadas en la URL. Esta API recibe autenticación únicamente por headers (`Authorization: Bearer`) y body JSON, por lo que no se ve afectada; conviene actualizar el paquete cuando Azure publique la versión corregida.
