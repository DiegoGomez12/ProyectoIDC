# Integración y Despliegue Continuo (GitHub Actions)

Pipeline que ejecuta las pruebas automáticamente, construye y sube las imágenes a Docker Hub, y despliega a Azure App Service con aprobación manual a producción.
Origen: Issue #7 · PR #22 · Issue #8 · PR #23 · Issue #10 · PR #28 · Issue #12 · PR #27

## ¿Cuándo corre?
- En cada **Pull Request** hacia `main`: ejecuta pruebas y valida el build de ambas imágenes Docker (sin subir ni desplegar).
- En cada **push a `main`** (después de un merge): ejecuta pruebas, publica imágenes en Docker Hub y solicita aprobación manual para desplegar a Azure.

## Jobs
| Job | Qué hace |
|---|---|
| `Backend - pruebas` | Instala Node 24, `npm ci` y `npm test` en `backend/` (Jest + Supertest). |
| `Frontend - pruebas` | Instala Node 24, `npm ci` y `npm test` en `frontend/` (Vitest + React Testing Library). |
| `Docker - Build y Push` | Compila las imágenes de Backend (`timecheck-api`) y Frontend (`timecheck-web`, inyectando `VITE_API_URL`) con Buildx. En PR valida compilación; en `main` se autentica y sube a Docker Hub. |
| `Deploy - Azure App Service` | Solo corre en `main` tras `docker`. Pausa esperando aprobación manual en el ambiente `production`, dispara los Webhooks de Azure App Service y verifica `/health` del Backend. |

Las pruebas del backend y del frontend no usan base de datos (los modelos y llamadas `fetch` se simulan), por eso no necesitan Postgres ni secrets. Los jobs de Docker y Deploy usan los secrets y variables configurados en el repositorio (ver abajo).

## Secretos y Variables requeridos
En `Settings > Secrets and variables > Actions`:
- **Secrets (Repository):**
  - `DOCKERHUB_USERNAME`: usuario de Docker Hub.
  - `DOCKERHUB_TOKEN`: token de acceso personal con permisos de lectura y escritura.
- **Variables (Repository):**
  - `VITE_API_URL`: URL pública del backend en Azure (`https://timecheck-api-equipo-idc.azurewebsites.net`), inyectada como `build-arg` al compilar el frontend y usada en la verificación de `/health`.
- **Environment `production` (`Settings > Environments > production`, con *Required reviewers*):**
  - `AZURE_API_WEBHOOK_URL`: URL del webhook de despliegue continuo del App Service del backend.
  - `AZURE_WEB_WEBHOOK_URL`: URL del webhook de despliegue continuo del App Service del frontend.

## Decisiones
- **`npm ci` + caché de npm:** instalación reproducible desde `package-lock.json` y rápida entre corridas.
- **`permissions: contents: read`:** el pipeline solo lee el repo (mínimo privilegio).
- **`concurrency`:** en Pull Requests cancela corridas anteriores de la misma rama; en `main` usa `github.run_id` para evitar que un nuevo merge cancele un `deploy` que esté esperando aprobación manual.
- **Checks obligatorios:** en la protección de `main` están marcados `Backend - pruebas` y `Frontend - pruebas` como requeridos; si alguno falla, GitHub bloquea el merge.
- **`needs: [backend, frontend]`:** no construye ni sube imágenes si alguna suite de pruebas falla.
- **Doble etiqueta (tags) y alcance de `:latest`:** cada imagen se sube con `:latest` y con el SHA del commit al hacer merge a `main`, **antes** de la aprobación manual en `production`; por ello, un reinicio inesperado del App Service podría tomar una imagen `:latest` aún sin aprobar.
- **Webhooks disparados por Actions (no por Docker Hub):** la propuesta original mencionaba Docker Hub → Azure, pero el webhook nativo de Docker Hub **no debe activarse** porque desplegaría de inmediato al hacer push y se saltaría la aprobación manual de `production`. GitHub Actions es quien invoca los webhooks de Azure tras la aprobación.

## Cómo ver los resultados
- En el PR, sección de checks al final de la conversación.
- Pestaña **Actions** del repositorio para el detalle de cada paso y para aprobar despliegues pendientes en `production`.

## Cómo agregar un job nuevo
Copiar uno de los jobs de pruebas dentro de `ci.yml` y cambiar `working-directory` y `cache-dependency-path`. Si el job debe bloquear el merge, agregarlo también como check requerido en la protección de `main`.