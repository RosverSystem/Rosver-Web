-- Columna de trazabilidad: precio de oferta migrado a offer_combo.
-- Idempotente (ADD COLUMN IF NOT EXISTS).
-- Los precios con price_kind='offer' NO se destruyen; se marcan con el combo creado.

ALTER TABLE product_prices
  ADD COLUMN IF NOT EXISTS migrated_to_combo_id UUID REFERENCES offer_combos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_prices_migrated
  ON product_prices (migrated_to_combo_id)
  WHERE migrated_to_combo_id IS NOT NULL;
