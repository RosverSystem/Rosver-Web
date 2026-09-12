-- Agencia: solo nombre; ubigeo de destino vive en ship_*.
-- Idempotente (si las columnas ya se eliminaron en 021, no hace nada).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quote_requests'
      AND column_name = 'agency_department_code'
  ) THEN
    ALTER TABLE quote_requests
      ALTER COLUMN agency_department_code DROP NOT NULL,
      ALTER COLUMN agency_department_name DROP NOT NULL,
      ALTER COLUMN agency_province_code DROP NOT NULL,
      ALTER COLUMN agency_province_name DROP NOT NULL,
      ALTER COLUMN agency_district_code DROP NOT NULL,
      ALTER COLUMN agency_district_name DROP NOT NULL;
  END IF;
END $$;
