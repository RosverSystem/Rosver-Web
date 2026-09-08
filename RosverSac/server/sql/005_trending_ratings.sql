-- Tendencia home + reseñas / calificaciones
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trending_sort INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_trending_home
  ON products (trending_sort ASC, rating DESC, review_count DESC)
  WHERE trending = true AND visible = true;

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product
  ON product_reviews (product_id, visible, created_at DESC);

COMMENT ON COLUMN products.trending IS 'Aparece en Productos en tendencia (home)';
COMMENT ON COLUMN products.trending_sort IS 'Orden manual en tendencia (menor = primero)';
COMMENT ON TABLE product_reviews IS 'Reseñas; products.rating / review_count se recalculan';
