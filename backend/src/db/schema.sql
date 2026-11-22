CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'empleado'
                CHECK (rol IN ('admin', 'empleado')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asistencias (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  hora_entrada  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_salida   TIMESTAMPTZ,
  estatus       VARCHAR(20) NOT NULL DEFAULT 'activo'
                CHECK (estatus IN ('activo', 'completado')),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantiza en la BD que un usuario no tenga dos jornadas activas al mismo tiempo
CREATE UNIQUE INDEX IF NOT EXISTS asistencias_una_activa_por_usuario
  ON asistencias (usuario_id)
  WHERE estatus = 'activo';