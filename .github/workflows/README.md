# Integración Continua (GitHub Actions)

Pipeline que ejecuta las pruebas automáticamente para que nada se integre a `main` sin pasar la suite.
Origen: Issue #7 · PR #22 · Issue #8 · PR #23

## ¿Cuándo corre?
- En cada **Pull Request** hacia `main`.
- En cada **push a `main`** (después de un merge), para confirmar que `main` sigue en verde.

## Jobs
| Job | Qué hace |
|---|---|
| `Backend - pruebas` | Instala Node 24, `npm ci` y `npm test` en `backend/` (Jest + Supertest). |
| `Docker - Build y Push` | Compila las imágenes de Backend (`timecheck-api`) y Frontend (`timecheck-web`) con Buildx. En PR valida compilación; en `main` se autentica y sube a Docker Hub. |

Las pruebas del backend no usan base de datos (el modelo se simula), por eso el job de pruebas no necesita Postgres ni secrets. El job de Docker sí usa los secrets de Docker Hub (ver abajo).

## Secretos requeridos (Docker Hub)
En `Settings > Secrets and variables > Actions`:
- `DOCKERHUB_USERNAME`: usuario de Docker Hub.
- `DOCKERHUB_TOKEN`: token de acceso personal con permisos de lectura y escritura.

## Decisiones
- **`npm ci` + caché de npm:** instalación reproducible desde `package-lock.json` y rápida entre corridas.
- **`permissions: contents: read`:** el pipeline solo lee el repo (mínimo privilegio).
- **`concurrency`:** si llegan commits nuevos al mismo PR, se cancela la corrida anterior.
- **Check obligatorio:** en la protección de `main` está marcado `Backend - pruebas` como requerido; si falla, GitHub bloquea el merge.
- **`needs: backend`:** no construye ni sube imágenes si las pruebas fallan.
- **Doble etiqueta (tags):** cada imagen se sube con `:latest` y con el SHA del commit.

## Cómo ver los resultados
- En el PR, sección de checks al final de la conversación.
- Pestaña **Actions** del repositorio para el detalle de cada paso.

## Cómo agregar un job nuevo
Copiar el job `backend` dentro de `ci.yml` y cambiar `working-directory` y `cache-dependency-path`. Por ejemplo, para el frontend (cuando tenga pruebas, Issue #10): `frontend` y `frontend/package-lock.json`.
Si el job debe bloquear el merge, agregarlo también como check requerido en la protección de `main`.