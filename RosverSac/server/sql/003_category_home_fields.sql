-- Categorías: campos para inicio "Explora por categoría" + menú
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS highlight_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN categories.tagline IS 'Etiqueta corta roja de la card en inicio';
COMMENT ON COLUMN categories.highlight_points IS 'Array JSON de 1–3 textos para bullets de la card';
COMMENT ON COLUMN categories.show_on_home IS 'Visible en Explora por categoría (solo principales)';
