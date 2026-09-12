-- Cantidades / presentaciones por tipo de unidad (cascada tipo ubigeo).
-- Ej.: Caja → 10, 20, 100 unidades.

CREATE TABLE IF NOT EXISTS unit_type_quantities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_type_id UUID NOT NULL REFERENCES unit_types(id) ON DELETE CASCADE,
  content_qty NUMERIC(18, 4) NOT NULL CHECK (content_qty > 0),
  label TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_type_id, content_qty)
);

CREATE INDEX IF NOT EXISTS idx_unit_type_quantities_unit
  ON unit_type_quantities(unit_type_id, sort_order, content_qty);

-- Semilla desde presentaciones ya usadas en productos
INSERT INTO unit_type_quantities (unit_type_id, content_qty, label, sort_order)
SELECT DISTINCT ON (pp.unit_type_id, pp.content_qty)
  pp.unit_type_id,
  pp.content_qty,
  NULLIF(trim(pp.label), ''),
  0
FROM product_packagings pp
ORDER BY pp.unit_type_id, pp.content_qty
ON CONFLICT (unit_type_id, content_qty) DO NOTHING;
