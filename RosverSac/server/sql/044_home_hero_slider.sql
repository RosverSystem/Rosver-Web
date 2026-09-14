-- Slider home_hero: asegura fila site_content (idempotente).
-- El seed de slides lo aplica la API al primer GET si falta o está vacío.

INSERT INTO site_content (key, value, updated_at)
VALUES (
  'home_hero',
  '{"ctaTitle":"DESPACHOS Y CATÁLOGO OFICIAL","ctaLabel":"Descargar PDF","autoplayMs":5000,"slides":[]}'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;
