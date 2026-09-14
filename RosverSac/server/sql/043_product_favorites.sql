-- Favoritos de producto por cliente (sesión).
-- Idempotente.

CREATE TABLE IF NOT EXISTS product_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_favorites_user_created
  ON product_favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_favorites_product
  ON product_favorites (product_id);

COMMENT ON TABLE product_favorites IS
  'Productos marcados como favoritos por cada cliente; tienda /cuenta/favoritos + ficha admin clientes';
