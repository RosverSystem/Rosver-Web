-- Solicitudes de cotización (/cotizar) + ubigeo de entrega y agencia.
-- Idempotente.

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT NOT NULL,

  ship_department_code TEXT NOT NULL,
  ship_department_name TEXT NOT NULL,
  ship_province_code TEXT NOT NULL,
  ship_province_name TEXT NOT NULL,
  ship_district_code TEXT NOT NULL,
  ship_district_name TEXT NOT NULL,
  ship_address TEXT NOT NULL,

  agency_name TEXT NOT NULL,
  agency_department_code TEXT NOT NULL,
  agency_department_name TEXT NOT NULL,
  agency_province_code TEXT NOT NULL,
  agency_province_name TEXT NOT NULL,
  agency_district_code TEXT NOT NULL,
  agency_district_name TEXT NOT NULL,

  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_estimated NUMERIC(12, 2),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_created
  ON quote_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_requests_phone
  ON quote_requests (phone);

CREATE SEQUENCE IF NOT EXISTS quote_requests_code_seq START 1;
