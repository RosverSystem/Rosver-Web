-- Código interno numérico en tipos de unidad (mismo formato que productos).

ALTER TABLE unit_types
  ADD COLUMN IF NOT EXISTS internal_code INT;

UPDATE unit_types u
SET internal_code = s.n
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, name, id) - 1 AS n
  FROM unit_types
) s
WHERE u.id = s.id AND u.internal_code IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unit_types_internal_code_key'
  ) THEN
    ALTER TABLE unit_types
      ADD CONSTRAINT unit_types_internal_code_key UNIQUE (internal_code);
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS unit_types_internal_code_seq;
SELECT setval(
  'unit_types_internal_code_seq',
  GREATEST(COALESCE((SELECT MAX(internal_code) FROM unit_types), -1), -1) + 1,
  false
);

ALTER TABLE unit_types
  ALTER COLUMN internal_code SET DEFAULT nextval('unit_types_internal_code_seq');

UPDATE unit_types
SET internal_code = nextval('unit_types_internal_code_seq')
WHERE internal_code IS NULL;

ALTER TABLE unit_types
  ALTER COLUMN internal_code SET NOT NULL;
