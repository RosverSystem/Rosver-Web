-- Código interno numérico en tipos de especificación (SKU 00000000…).

ALTER TABLE spec_attributes
  ADD COLUMN IF NOT EXISTS internal_code INT;

UPDATE spec_attributes a
SET internal_code = s.n
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY is_system DESC, sort_order, name, id) - 1 AS n
  FROM spec_attributes
) s
WHERE a.id = s.id AND a.internal_code IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spec_attributes_internal_code_key'
  ) THEN
    ALTER TABLE spec_attributes
      ADD CONSTRAINT spec_attributes_internal_code_key UNIQUE (internal_code);
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS spec_attributes_internal_code_seq;
SELECT setval(
  'spec_attributes_internal_code_seq',
  GREATEST(COALESCE((SELECT MAX(internal_code) FROM spec_attributes), -1), -1) + 1,
  false
);

ALTER TABLE spec_attributes
  ALTER COLUMN internal_code SET DEFAULT nextval('spec_attributes_internal_code_seq');

UPDATE spec_attributes
SET internal_code = nextval('spec_attributes_internal_code_seq')
WHERE internal_code IS NULL;

ALTER TABLE spec_attributes
  ALTER COLUMN internal_code SET NOT NULL;

COMMENT ON COLUMN spec_attributes.internal_code IS
  'SKU interno (display 8 dígitos: 00000000, 00000001…). Independiente de key técnica.';
