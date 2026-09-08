-- Destacados home: orden explícito en carrusel
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured_sort INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_featured_home
  ON products (featured_sort ASC, updated_at DESC)
  WHERE featured = true AND visible = true;

COMMENT ON COLUMN products.featured IS 'Aparece en Destacados para ti (home)';
COMMENT ON COLUMN products.featured_sort IS 'Orden en carrusel home (menor = primero)';
