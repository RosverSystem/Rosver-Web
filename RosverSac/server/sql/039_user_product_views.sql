-- Interés por cliente: vistas de producto por usuario (sesión).
-- Idempotente.

CREATE TABLE IF NOT EXISTS user_product_views (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 1,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_product_views_user_last
  ON user_product_views (user_id, last_viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_product_views_user_freq
  ON user_product_views (user_id, view_count DESC);

COMMENT ON TABLE user_product_views IS
  'Vistas de ficha por cliente logueado; alimenta módulo /admin/clientes';
