# Infraestructura: Aprovisionamiento en Azure (PostgreSQL + App Service)

## ¿Quién usa esto?
La infraestructura de Azure ya está aprovisionada y la administra Diego. Para desarrollar no hace falta correr Terraform ni conectarse a Azure: se usa la base local con docker compose (ver README principal, "Entorno de desarrollo local"). 

Este Terraform solo se usa para modificar o recrear los recursos de la nube. El archivo `terraform.tfstate` vive en la máquina de quien hizo el apply.

---

## 1. Resumen
Implementación de Infraestructura como Código (IaC) mediante **Terraform** para aprovisionar de forma automatizada y reproducible la arquitectura en **Microsoft Azure**:
- **Base de datos relacional:** Azure Database for PostgreSQL Flexible Server (Issue #11).
- **Aplicaciones en contenedores:** Azure App Service Plan (Linux) con dos Web Apps conectadas a Docker Hub (`timecheck-api` y `timecheck-web`) y despliegue continuo vía Webhook (Issue #12).
- **Observabilidad y monitoreo:** Log Analytics Workspace, Application Insights, Diagnostic Settings y alertas por correo ante errores HTTP 5xx (Issue #29 / Story #18).

---

## 2. Decisiones Técnicas y Arquitectura

### Base de Datos (PostgreSQL)
| Parámetro | Configuración | Justificación Técnica |
| :--- | :--- | :--- |
| **Servicio** | Azure Database for PostgreSQL (Flexible Server) | Servicio administrado con soporte de respaldos automáticos, alta disponibilidad y mantenimiento sin intervención manual. |
| **Motor / Versión** | PostgreSQL 15 | Versión estable con compatibilidad para los ORMs y drivers modernos de Node.js (`pg`, Prisma, Sequelize). |
| **Tier / SKU** | Burstable (`B_Standard_B1ms`) | 1 vCore, 2 GiB RAM. Configuración orientada a entornos de desarrollo y pruebas, optimizando el consumo de recursos en la nube. |
| **Almacenamiento** | 32 GiB | Capacidad mínima permitida por Azure para arranque y pruebas. |
| **Región** | `centralus` (Centro de EE. UU.) | Selección estratégica basada en disponibilidad de cuotas de cómputo para el nivel *Burstable* y sin restricciones de aprovisionamiento en la suscripción. |
| **Base de Datos Inicial** | `timecheck` | Base de datos relacional dedicada para las tablas del sistema. |

### Contenedores (Azure App Service)
| Parámetro | Configuración | Justificación Técnica |
| :--- | :--- | :--- |
| **App Service Plan** | Linux `B1` (`asp-timecheck`) | Nivel básico requerido por Azure para ejecutar imágenes Docker personalizadas con `always_on = true`. |
| **Región** | `westus2` (Oeste de EE. UU. 2) | Región con cuota activa de instancias B1 en la suscripción. |
| **Backend (`timecheck-api-equipo-idc`)** | `diegogomez3/timecheck-api:latest` (Puerto `3000`) | Expone la API REST sobre HTTPS con variables de entorno inyectadas desde Terraform (DB, SSL, JWT y CORS hacia el frontend). |
| **Frontend (`timecheck-web-equipo-idc`)** | `diegogomez3/timecheck-web:latest` (Puerto `80`) | Sirve la SPA de React compilada con Nginx. |
| **Despliegue Continuo** | `DOCKER_ENABLE_CI = "true"` + Webhooks | Permite que GitHub Actions dispare la descarga y reinicio automático de contenedores tras aprobar el despliegue a `production`. |

### Observabilidad y Monitoreo (Azure Monitor)
| Recurso | Configuración | Propósito |
| :--- | :--- | :--- |
| **Log Analytics Workspace** | `law-timecheck` (`PerGB2018`, 30 días, `westus2`) | Almacén centralizado de logs HTTP, consola de contenedores y métricas (primeros 5 GB/mes gratuitos). |
| **Application Insights** | `ai-timecheck` (`Node.JS`, ligado a `law-timecheck`) | Telemetría del backend vía `@azure/monitor-opentelemetry`: *Live Metrics*, *Application Map* (API → PostgreSQL), rendimiento por endpoint y errores. |
| **Diagnostic Settings** | `diag-timecheck-api` y `diag-timecheck-web` | Reenvío automático de `AppServiceHTTPLogs`, `AppServiceConsoleLogs`, `AppServiceAppLogs`, `AppServicePlatformLogs` y `AllMetrics` a Log Analytics. |
| **Alertas** | `alert-timecheck-api-5xx`, `alert-timecheck-api-health` y `ag-timecheck-alerts` | Envía notificación por correo si el backend registra errores HTTP `5xx` o si falla el sondeo periódico de `/health` (`HealthCheckStatus < 100`), incluso sin tráfico de usuarios. |

---

## 3. Seguridad y Redes

1. **Gestión de Secretos:**
   * Las credenciales sensibles están parametrizadas en variables de Terraform con el modificador `sensitive = true`, evitando su exposición en texto plano en logs de consola.
   * Los archivos locales con valores reales (`*.tfvars`), archivos de entorno (`.env`) y los archivos de estado (`*.tfstate`) se encuentran estrictamente excluidos del control de versiones mediante `.gitignore`.
2. **Cifrado en Tránsito (SSL/TLS):**
   * El servidor PostgreSQL exige conexiones cifradas mediante SSL (`sslmode=require`).
   * Ambos App Services tienen habilitado `https_only = true`, redirigiendo automáticamente el tráfico HTTP a HTTPS.
3. **Reglas de Firewall:**
   * Se configuró la regla `allow-azure-services` (`0.0.0.0`), que permite conexiones desde cualquier servicio alojado en Azure. Es necesaria porque el App Service (Issue #12) no tiene IP de salida fija. La autenticación por usuario/contraseña y SSL siguen siendo obligatorias.
   * El acceso desde redes externas permanece cerrado por defecto, requiriendo autorización explícita de direcciones IP para conexiones administrativas externas.

---

## 4. Estructura de Archivos de Infraestructura (`Infra/`)

```text
Infra/
├── main.tf             # Definición de proveedor, Resource Group, servidor, base de datos y firewall
├── variables.tf        # Declaración de variables de entrada, tipos y valores por defecto
├── outputs.tf          # Definición de salidas de conexión (Host FQDN, BD, usuario administrador)
├── .terraform.lock.hcl # Registro de versiones y hashes de proveedores para reproducibilidad
└── README.md           # Esta documentación técnica
```

---

## 5. Procedimiento de Ejecución (IaC)

Para replicar o desplegar esta infraestructura en un entorno nuevo:

1. **Autenticación en Azure CLI:**
   ```bash
   az login
   ```
2. **Inicialización de Terraform:**
   ```bash
   cd Infra
   terraform init
   ```
3. **Configuración de Variables:**
   Crear un archivo local `Infra/terraform.tfvars` (ignorado por Git):
   ```hcl
   resource_group_name = "rg-timecheck"
   location            = "centralus"
   server_name         = "timecheck-db-equipo-idc"
   db_name             = "timecheck"
   admin_username      = "timecheck_admin"
   admin_password      = "<PASSWORD_SEGURO>"
   dockerhub_username  = "<USUARIO_DOCKERHUB>"
   api_app_name        = "timecheck-api-equipo-idc"
   web_app_name        = "timecheck-web-equipo-idc"
   jwt_secret          = "<SECRET_JWT_SEGURO>"
   alert_email         = "<CORREO_ALERTAS>"
   ```
4. **Planificación (Dry-run):**
   ```bash
   terraform plan
   ```
5. **Aplicación del despliegue:**
   ```bash
   terraform apply
   ```
6. **Destrucción (Gestión de costos cuando no esté en uso):**
   ```bash
   terraform destroy
   ```

---

## 6. Parámetros de Conexión para el Backend

Para la integración con la capa de backend (Node.js/Express), se requiere configurar las siguientes variables en el entorno correspondiente:

```dotenv
DB_HOST=<HOST_SERVIDOR_POSTGRES>.postgres.database.azure.com
DB_PORT=5432
POSTGRES_DB=timecheck
POSTGRES_USER=timecheck_admin
POSTGRES_PASSWORD=<PASSWORD_ADMIN>
```

> [!NOTE]
> `rejectUnauthorized: false` cifra la conexión pero no valida el certificado del servidor. Para el entorno de desarrollo del proyecto es adecuado, pero en entornos de producción se recomienda validar el certificado oficial de la entidad certificadora de Microsoft.

---

## 7. Cómo Consultar Métricas, Logs y Alertas en Azure
1. **Live Metrics y Application Map:** Portal de Azure → `ai-timecheck` (Application Insights) → **Métricas en tiempo real** (*Live Metrics*) o **Mapa de aplicación** (*Application Map*) para ver peticiones en vivo, tiempos de respuesta y llamadas a PostgreSQL.
2. **Errores y rendimiento:** `ai-timecheck` → **Errores** (*Failures*) y **Rendimiento** (*Performance*).
   > Por defecto, `@azure/monitor-opentelemetry` aplica muestreo de ~5 peticiones por segundo, por lo que en ráfagas de tráfico no se guardan todas las peticiones individuales.
3. **Logs de contenedores y HTTP (KQL):** `law-timecheck` → **Registros** (*Logs*). Ejemplo para ver errores recientes:
   ```kql
   AppServiceHTTPLogs
   | where ScStatus >= 400
   | order by TimeGenerated desc
   | take 50
   ```
4. **Alertas:** Portal de Azure → **Monitor → Alertas** → verificar las reglas `alert-timecheck-api-5xx` y `alert-timecheck-api-health`.

---
Issue #11 · PR #13 · Issue #12 · PR #27 · Issue #29 · PR #30
