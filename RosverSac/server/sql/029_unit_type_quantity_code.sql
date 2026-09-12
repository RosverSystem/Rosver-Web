-- Código interno numérico en cantidades de presentación (como productos).

ALTER TABLE unit_type_quantities
  ADD COLUMN IF NOT EXISTS code INT;

UPDATE unit_type_quantities u
SET code = s.n
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, content_qty) - 1 AS n
  FROM unit_type_quantities
) s
WHERE u.id = s.id AND u.code IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unit_type_quantities_code_key'
  ) THEN
    ALTER TABLE unit_type_quantities
      ADD CONSTRAINT unit_type_quantities_code_key UNIQUE (code);
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS unit_type_quantities_code_seq;
SELECT setval(
  'unit_type_quantities_code_seq',
  GREATEST(COALESCE((SELECT MAX(code) FROM unit_type_quantities), -1), -1) + 1,
  false
);

ALTER TABLE unit_type_quantities
  ALTER COLUMN code SET DEFAULT nextval('unit_type_quantities_code_seq');

UPDATE unit_type_quantities SET code = nextval('unit_type_quantities_code_seq')
WHERE code IS NULL;

ALTER TABLE unit_type_quantities
  ALTER COLUMN code SET NOT NULL;
