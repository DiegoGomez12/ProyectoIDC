# ProyectoIDC – TimeCheck
Plataforma web para registrar entradas y salidas (Check-in / Check-out), construida para demostrar un ciclo completo de CI/CD con DevOps, contenedores e Infraestructura como Código en Azure. Ver [Propuesta](Propuesta.md).

## Documentación por sección
Cada sección tiene su propio README con el contexto de cómo y por qué se construyó.

| Sección | Documentación | Issue |
|---|---|---|
| Infraestructura en Azure (Terraform) | [Infra/README.md](Infra/README.md) | #11 |
| Entorno local (Docker Compose) | [Docs/entorno-desarrollo-local.md](Docs/entorno-desarrollo-local.md) | #3 |
| Backend (API REST) | [backend/README.md](backend/README.md) | #4 |
| Integración continua (GitHub Actions) | [.github/workflows/README.md](.github/workflows/README.md) | #7 |

## Inicio rápido (desarrollo local)
No hace falta acceso a Azure: la base de datos corre en Docker.

1. Crear `.env` en la raíz con las variables de [la base de datos](Docs/entorno-desarrollo-local.md) y [el backend](backend/README.md#variables-de-entorno).
2. Levantar y preparar:
```bash
docker compose up -d          # PostgreSQL local
cd backend
npm install
npm run db:init               # crea las tablas
npm run dev                   # API en http://localhost:3000/health
```


## Flujo de trabajo
GitHub Flow: ramas `feature/...` desde `main`, Pull Request con revisión de un compañero y merge a `main`.