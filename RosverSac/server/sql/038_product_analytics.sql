-- Contadores de demanda + serie diaria para analítica / tendencia.
-- Idempotente.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN products.view_count IS 'Vistas de ficha (tienda)';
COMMENT ON COLUMN products.order_count IS 'Unidades pedidas (líneas product, no combo)';
COMMENT ON COLUMN products.quote_count IS 'Unidades cotizadas (líneas product)';

CREATE INDEX IF NOT EXISTS idx_products_view_count
  ON products (view_count DESC)
  WHERE visible = true;

CREATE INDEX IF NOT EXISTS idx_products_order_count
  ON products (order_count DESC)
  WHERE visible = true;

CREATE INDEX IF NOT EXISTS idx_products_quote_count
  ON products (quote_count DESC)
  WHERE visible = true;

CREATE TABLE IF NOT EXISTS product_metrics_daily (
  day DATE NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  quotes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_metrics_daily_day
  ON product_metrics_daily (day DESC);

COMMENT ON TABLE product_metrics_daily IS
  'Rollup diario por producto: vistas, pedidos, cotizaciones';
