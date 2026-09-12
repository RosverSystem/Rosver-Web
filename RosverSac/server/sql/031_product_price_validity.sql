-- Ofertas / precios con ventana de vigencia (descuento por tiempo limitado).
-- NULL en ambas = siempre vigente (comportamiento anterior).

ALTER TABLE product_prices
  ADD COLUMN IF NOT EXISTS valid_from timestamptz,
  ADD COLUMN IF NOT EXISTS valid_to timestamptz;

COMMENT ON COLUMN product_prices.valid_from IS
  'Inicio de vigencia (ofertas). NULL = sin inicio.';
COMMENT ON COLUMN product_prices.valid_to IS
  'Fin de vigencia (ofertas). NULL = sin fin.';
