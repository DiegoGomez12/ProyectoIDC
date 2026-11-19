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
