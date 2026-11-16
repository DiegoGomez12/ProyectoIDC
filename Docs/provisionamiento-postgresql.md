# Documentación de Infraestructura: Aprovisionamiento de PostgreSQL en Azure (Issue #11)

## 1. Resumen
Como parte del **Issue #11**, se implementó la Infraestructura como Código (IaC) mediante **Terraform** para aprovisionar de forma automatizada y reproducible la base de datos relacional del proyecto en **Microsoft Azure** utilizando el servicio administrado **Azure Database for PostgreSQL Flexible Server**.

---

## 2. Decisiones Técnicas y Arquitectura

| Parámetro | Configuración | Justificación Técnica |
| :--- | :--- | :--- |
| **Servicio** | Azure Database for PostgreSQL (Flexible Server) | Servicio administrado con soporte de respaldos automáticos, alta disponibilidad y mantenimiento sin intervención manual. |
| **Motor / Versión** | PostgreSQL 15 | Versión estable con compatibilidad para los ORMs y drivers modernos de Node.js (`pg`, Prisma, Sequelize). |
| **Tier / SKU** | Burstable (`B_Standard_B1ms`) | 1 vCore, 2 GiB RAM. Configuración orientada a entornos de desarrollo y pruebas, optimizando el consumo de recursos en la nube. |
| **Almacenamiento** | 32 GiB | Capacidad mínima permitida por Azure para arranque y pruebas. |
| **Región** | `centralus` (Centro de EE. UU.) | Selección estratégica basada en disponibilidad de cuotas de cómputo para el nivel *Burstable* y sin restricciones de aprovisionamiento en la suscripción. |
| **Base de Datos Inicial** | Parametrizada por variable | Base de datos relacional dedicada para las tablas del sistema. |

---

## 3. Seguridad y Redes

1. **Gestión de Secretos:**
   * Las credenciales sensibles están parametrizadas en variables de Terraform con el modificador `sensitive = true`, evitando su exposición en texto plano en logs de consola.
   * Los archivos locales con valores reales (`*.tfvars`), archivos de entorno (`.env`) y los archivos de estado (`*.tfstate`) se encuentran excluidos del control de versiones mediante `.gitignore`.
2. **Cifrado en Tránsito (SSL/TLS):**
   * El servidor exige de forma predeterminada conexiones cifradas mediante SSL (`sslmode=require`).
3. **Reglas de Firewall:**
   * Se configuró la regla `allow-azure-services` (`0.0.0.0` a `0.0.0.0`) para permitir el acceso exclusivo a futuros servicios desplegados en el ecosistema de Azure (necesario para la conexión con el backend en Azure App Service correspondiente al Issue #12).
   * El acceso desde redes externas permanece cerrado por defecto, requiriendo autorización explícita de direcciones IP para conexiones administrativas externas.

---

## 4. Estructura de Archivos de Infraestructura (`Infra/`)

```text
Infra/
├── main.tf        # Definición de proveedor, Resource Group, servidor, base de datos y firewall
├── variables.tf   # Declaración de variables de entrada, tipos y valores por defecto
└── outputs.tf     # Definición de salidas de conexión (Host FQDN, BD, usuario administrador)
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
3. **Planificación (Dry-run):**
   ```bash
   terraform plan
   ```
4. **Aplicación del despliegue:**
   ```bash
   terraform apply
   ```
5. **Destrucción (Gestión de costos cuando no esté en uso):**
   ```bash
   terraform destroy
   ```

---

## 6. Parámetros de Conexión para el Backend

Para la integración con la capa de backend (Node.js/Express), se requiere configurar las siguientes variables en el entorno correspondiente:

```dotenv
DB_HOST=<HOST_SERVIDOR_POSTGRES>.postgres.database.azure.com
DB_PORT=5432
POSTGRES_DB=<NOMBRE_BASE_DATOS>
POSTGRES_USER=<USUARIO_ADMIN>
POSTGRES_PASSWORD=<PASSWORD_ADMIN>
```
> [!NOTE]
> Las conexiones de la aplicación deben incluir el flag de SSL habilitado (`ssl: { rejectUnauthorized: false }`).
