-- Quitar ubigeo de agencia (solo se guarda el nombre; destino = ship_*).
ALTER TABLE quote_requests
  DROP COLUMN IF EXISTS agency_department_code,
  DROP COLUMN IF EXISTS agency_department_name,
  DROP COLUMN IF EXISTS agency_province_code,
  DROP COLUMN IF EXISTS agency_province_name,
  DROP COLUMN IF EXISTS agency_district_code,
  DROP COLUMN IF EXISTS agency_district_name;
