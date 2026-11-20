# Integración y Despliegue Continuo (GitHub Actions)

Pipeline que ejecuta las pruebas automáticamente, construye y sube las imágenes a Docker Hub, y despliega a Azure App Service con aprobación manual a producción.
Origen: Issue #7 · PR #22 · Issue #8 · PR #23 · Issue #12

## ¿Cuándo corre?
- En cada **Pull Request** hacia `main`: ejecuta pruebas y valida el build de ambas imágenes Docker (sin subir ni desplegar).
- En cada **push a `main`** (después de un merge): ejecuta pruebas, publica imágenes en Docker Hub y solicita aprobación manual para desplegar a Azure.

## Jobs
| Job | Qué hace |
|---|---|
| `Backend - pruebas` | Instala Node 24, `npm ci` y `npm test` en `backend/` (Jest + Supertest). |
| `Docker - Build y Push` | Compila las imágenes de Backend (`timecheck-api`) y Frontend (`timecheck-web`, inyectando `VITE_API_URL`) con Buildx. En PR valida compilación; en `main` se autentica y sube a Docker Hub. |
| `Deploy - Azure App Service` | Solo corre en `main` tras `docker`. Pausa esperando aprobación manual en el ambiente `production` y luego dispara los Webhooks de Azure App Service para actualizar Backend y Frontend. |

Las pruebas del backend no usan base de datos (el modelo se simula), por eso el job de pruebas no necesita Postgres ni secrets. Los jobs de Docker y Deploy usan los secrets y variables configurados en el repositorio (ver abajo).

## Secretos y Variables requeridos
En `Settings > Secrets and variables > Actions`:
- **Secrets (Repository):**
  - `DOCKERHUB_USERNAME`: usuario de Docker Hub.
  - `DOCKERHUB_TOKEN`: token de acceso personal con permisos de lectura y escritura.
- **Variables (Repository):**
  - `VITE_API_URL`: URL pública del backend en Azure (`https://timecheck-api-equipo-idc.azurewebsites.net`), inyectada como `build-arg` al compilar el frontend.
- **Environment `production` (`Settings > Environments > production`, con *Required reviewers*):**
  - `AZURE_API_WEBHOOK_URL`: URL del webhook de despliegue continuo del App Service del backend.
  - `AZURE_WEB_WEBHOOK_URL`: URL del webhook de despliegue continuo del App Service del frontend.

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