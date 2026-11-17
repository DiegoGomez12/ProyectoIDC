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

## Estructura
```text
backend/
├── src/
│   ├── app.js           # Configura Express (sin listen, para poder probarlo con Supertest)
│   ├── server.js        # Arranca el servidor
│   ├── config/env.js    # Carga el .env de la raíz del repo
│   ├── config/db.js     # Pool de conexiones a PostgreSQL
│   ├── db/
│   │   ├── schema.sql   # Definición de tablas
│   │   └── init.js      # Aplica schema.sql (npm run db:init)
│   ├── models/          # Consultas SQL (nunca devuelven password_hash, salvo para login)
│   ├── controllers/     # Lógica de cada endpoint y validaciones
│   ├── middlewares/     # autenticar (JWT) y soloAdmin (rol)
│   └── routes/          # URL → middleware → controlador
└── tests/               # Pruebas con Jest + Supertest (el modelo se simula)
```

## Endpoints
| Método | Ruta | Quién | Qué hace |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/usuarios` | Público | Registro; siempre crea con rol empleado |
| `POST` | `/api/auth/login` | Público | Devuelve `{ token, usuario }` |
| `GET` | `/api/usuarios` | Admin | Lista todos |
| `GET` | `/api/usuarios/:id` | Admin o el mismo usuario | Obtiene uno |
| `PUT` | `/api/usuarios/:id` | Admin o el mismo usuario | Edita (solo el admin puede cambiar rol) |
| `DELETE` | `/api/usuarios/:id` | Admin | Elimina |

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

