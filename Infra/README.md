# Infraestructura: Aprovisionamiento de PostgreSQL en Azure

## ¿Quién usa esto?
La infraestructura de Azure ya está aprovisionada y la administra Diego. Para desarrollar no hace falta correr Terraform ni conectarse a Azure: se usa la base local con docker compose (ver README principal, "Entorno de desarrollo local"). 

Este Terraform solo se usa para modificar o recrear los recursos de la nube. El archivo `terraform.tfstate` vive en la máquina de quien hizo el apply.

---

## 1. Resumen
Implementación de Infraestructura como Código (IaC) mediante **Terraform** para aprovisionar de forma automatizada y reproducible la base de datos relacional del proyecto en **Microsoft Azure** utilizando el servicio administrado **Azure Database for PostgreSQL Flexible Server**.

---

## 2. Decisiones Técnicas y Arquitectura

| Parámetro | Configuración | Justificación Técnica |
| :--- | :--- | :--- |
| **Servicio** | Azure Database for PostgreSQL (Flexible Server) | Servicio administrado con soporte de respaldos automáticos, alta disponibilidad y mantenimiento sin intervención manual. |
| **Motor / Versión** | PostgreSQL 15 | Versión estable con compatibilidad para los ORMs y drivers modernos de Node.js (`pg`, Prisma, Sequelize). |
| **Tier / SKU** | Burstable (`B_Standard_B1ms`) | 1 vCore, 2 GiB RAM. Configuración orientada a entornos de desarrollo y pruebas, optimizando el consumo de recursos en la nube. |
| **Almacenamiento** | 32 GiB | Capacidad mínima permitida por Azure para arranque y pruebas. |
| **Región** | `centralus` (Centro de EE. UU.) | Selección estratégica basada en disponibilidad de cuotas de cómputo para el nivel *Burstable* y sin restricciones de aprovisionamiento en la suscripción. |
| **Base de Datos Inicial** | `timecheck` | Base de datos relacional dedicada para las tablas del sistema. |

---

## 3. Seguridad y Redes

1. **Gestión de Secretos:**
   * Las credenciales sensibles están parametrizadas en variables de Terraform con el modificador `sensitive = true`, evitando su exposición en texto plano en logs de consola.
   * Los archivos locales con valores reales (`*.tfvars`), archivos de entorno (`.env`) y los archivos de estado (`*.tfstate`) se encuentran estrictamente excluidos del control de versiones mediante `.gitignore`.
2. **Cifrado en Tránsito (SSL/TLS):**
   * El servidor exige de forma predeterminada conexiones cifradas mediante SSL (`sslmode=require`).
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
   server_name         = "timecheck-db-equipo"
   db_name             = "timecheck"
   admin_username      = "timecheck_admin"
   admin_password      = "<PASSWORD_SEGURO>"
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
Issue #11 · PR #13
