CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'empleado'
                CHECK (rol IN ('admin', 'empleado')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);