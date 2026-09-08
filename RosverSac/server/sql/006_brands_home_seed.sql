-- Marcas en home (slider) + seed marcas por defecto del marquee
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN brands.show_on_home IS 'Visible en franja «Marcas que importamos»';

CREATE INDEX IF NOT EXISTS idx_brands_home
  ON brands (sort_order ASC, name)
  WHERE visible = true AND show_on_home = true;

-- Seed idempotente (SKU único)
INSERT INTO brands (sku, name, slug, visible, show_on_home, sort_order)
VALUES
  ('BOSCH', 'Bosch', 'bosch', true, true, 1),
  ('DEWALT', 'DeWalt', 'dewalt', true, true, 2),
  ('3M', '3M', '3m', true, true, 3),
  ('INGCO', 'Ingco', 'ingco', true, true, 4),
  ('TOTAL', 'Total', 'total', true, true, 5),
  ('TRUPER', 'Truper', 'truper', true, true, 6),
  ('STANLEY', 'Stanley', 'stanley', true, true, 7),
  ('MAKITA', 'Makita', 'makita', true, true, 8)
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  visible = true,
  show_on_home = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
