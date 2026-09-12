-- Calificaciones públicas: 1 voto por producto (usuario o invitado).
-- Idempotente.

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS guest_key TEXT;

COMMENT ON COLUMN product_reviews.guest_key IS
  'Clave anónima (localStorage); NULL si el voto es de usuario logueado';

-- Un usuario logueado solo 1 reseña por producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_reviews_one_per_user
  ON product_reviews (product_id, user_id)
  WHERE user_id IS NOT NULL;

-- Un invitado (misma guest_key) solo 1 reseña por producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_reviews_one_per_guest
  ON product_reviews (product_id, guest_key)
  WHERE guest_key IS NOT NULL AND length(trim(guest_key)) > 0;

CREATE INDEX IF NOT EXISTS idx_products_ranking
  ON products (rating DESC, review_count DESC, updated_at DESC)
  WHERE visible = true AND review_count > 0;
