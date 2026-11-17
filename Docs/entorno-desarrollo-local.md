# Documentación de Entorno Local: Base de Datos con Docker Compose (Issue #3)

## 1. Resumen
Como parte del **Issue #3**, se implementó la orquestación del entorno de desarrollo local mediante **Docker Compose**. Esto permite a los desarrolladores del equipo inicializar una instancia de base de datos relacional PostgreSQL idéntica a la de producción de forma aislada, reproducible y sin depender de conexión a servicios en la nube.

---

## 2. Arquitectura del Servicio Local (`db`)

| Componente | Configuración | Justificación Técnica |
| :--- | :--- | :--- |
| **Imagen Base** | `postgres:15-alpine` | Imagen oficial basada en Alpine Linux, optimizada para reducir el peso (~90 MB) y minimizar la superficie de exposición ante vulnerabilidades. |
| **Persistencia** | Volumen con nombre (`postgres_data`) | Almacenamiento administrado por el motor de Docker que garantiza la persistencia de tablas y registros al reiniciar o apagar el contenedor (`docker compose down`). |
| **Aislamiento de Red** | Red interna dedicada (`timecheck-network`, driver `bridge`) | Aísla la comunicación del contenedor en una red privada virtual para futura vinculación con los contenedores de Backend y Frontend. |
| **Mecanismo de Salud** | Healthcheck nativo (`pg_isready`) | Evalúa cada 5 segundos si el motor de base de datos está listo para aceptar conexiones antes de permitir que otros servicios intenten consultar datos. |

---

## 3. Seguridad y Variables de Entorno

Siguiendo las directrices de seguridad y la metodología **12-Factor App**:
1. **Cero credenciales en el repositorio:** El archivo `docker-compose.yml` no contiene contraseñas ni usuarios quemados (*hardcoded*). Todas las variables se leen dinámicamente desde el entorno.
2. **Aislamiento por desarrollador:** Cada integrante configura sus credenciales en su archivo local `.env`, el cual se encuentra estrictamente ignorado por el control de versiones (`.gitignore`).
3. **Mapeo de puertos:** El puerto `5432` únicamente escucha peticiones en la interfaz local de la máquina del desarrollador (`localhost`), sin exposición a redes externas.

### 3.1. Plantilla de variables para `.env` local
Crear un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
POSTGRES_DB=timecheck_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_local
DB_PORT=5432
```

---

## 4. Guía de Operación para Desarrolladores

### 4.1. Arrancar el entorno
Para descargar la imagen e iniciar la base de datos en segundo plano:
```bash
docker compose up -d
```

### 4.2. Verificar el estado del servicio
Para validar que el contenedor esté activo y saludable (*healthy*):
```bash
docker compose ps
```

### 4.3. Prueba de conectividad interna
Para comprobar que el motor de base de datos recibe consultas SQL:
```bash
docker exec -it timecheck-db-local psql -U <USUARIO> -d <BASE_DE_DATOS> -c "SELECT 1 AS conexion_exitosa;"
```

### 4.4. Detener el entorno
Para apagar el contenedor y la red sin perder los datos almacenados en el volumen:
```bash
docker compose down
```
