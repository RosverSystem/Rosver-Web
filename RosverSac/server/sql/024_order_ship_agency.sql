-- Destino + agencia en pedidos (mismo criterio que cotizaciones).
ALTER TABLE order_requests
  ADD COLUMN IF NOT EXISTS ship_department_code TEXT,
  ADD COLUMN IF NOT EXISTS ship_department_name TEXT,
  ADD COLUMN IF NOT EXISTS ship_province_code TEXT,
  ADD COLUMN IF NOT EXISTS ship_province_name TEXT,
  ADD COLUMN IF NOT EXISTS ship_district_code TEXT,
  ADD COLUMN IF NOT EXISTS ship_district_name TEXT,
  ADD COLUMN IF NOT EXISTS ship_address TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT;
