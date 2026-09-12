-- Catálogo ubigeo Perú (INEI) para cotizar / direcciones.
CREATE TABLE IF NOT EXISTS peru_departments (
  code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  sort_id INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS peru_provinces (
  code CHAR(4) PRIMARY KEY,
  department_code CHAR(2) NOT NULL REFERENCES peru_departments (code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_id INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS peru_districts (
  code CHAR(6) PRIMARY KEY,
  province_code CHAR(4) NOT NULL REFERENCES peru_provinces (code) ON DELETE CASCADE,
  department_code CHAR(2) NOT NULL REFERENCES peru_departments (code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_id INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_peru_provinces_department
  ON peru_provinces (department_code);

CREATE INDEX IF NOT EXISTS idx_peru_districts_province
  ON peru_districts (province_code);

CREATE INDEX IF NOT EXISTS idx_peru_districts_department
  ON peru_districts (department_code);
