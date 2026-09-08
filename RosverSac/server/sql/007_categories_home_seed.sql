-- Seed categorías demo (inicio + menú) si aún no existen por sku.
-- Idempotente: ON CONFLICT (sku) DO UPDATE solo campos vacíos de home.

INSERT INTO categories (
  parent_id, sku, name, slug, image_url, visible, show_in_nav, show_on_home,
  tagline, highlight_points, sort_order
) VALUES
  (
    NULL, 'CAT-HERR', 'Herramientas', 'herramientas',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=480&q=75',
    true, true, true,
    'Listas para obra y taller',
    '["Marcas de importación","Stock continuo","Asesoría técnica"]'::jsonb,
    10
  ),
  (
    NULL, 'CAT-FERR', 'Ferretería', 'ferreteria',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=640&h=480&q=75',
    true, true, true,
    'Insumos al por mayor',
    '["Precio por volumen","MOQ flexible","Despacho nacional"]'::jsonb,
    20
  ),
  (
    NULL, 'CAT-ELEC', 'Electricidad', 'electricidad',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=640&h=480&q=75',
    true, true, true,
    'Material eléctrico industrial',
    '["Cableado y protección","Marcas confiables","Soporte técnico"]'::jsonb,
    30
  ),
  (
    NULL, 'CAT-SEGU', 'Seguridad', 'seguridad',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=640&h=480&q=75',
    true, true, true,
    'EPP y protección',
    '["Normas aplicables","Stock continuo","Asesoría de uso"]'::jsonb,
    40
  )
ON CONFLICT (sku) DO UPDATE SET
  show_on_home = COALESCE(categories.show_on_home, EXCLUDED.show_on_home),
  tagline = COALESCE(NULLIF(categories.tagline, ''), EXCLUDED.tagline),
  highlight_points = CASE
    WHEN categories.highlight_points IS NULL
      OR categories.highlight_points = '[]'::jsonb
    THEN EXCLUDED.highlight_points
    ELSE categories.highlight_points
  END,
  image_url = COALESCE(categories.image_url, EXCLUDED.image_url),
  show_in_nav = COALESCE(categories.show_in_nav, EXCLUDED.show_in_nav),
  updated_at = now();

-- Subcategorías bajo Herramientas / Ferretería
INSERT INTO categories (
  parent_id, sku, name, slug, visible, show_in_nav, show_on_home, sort_order
)
SELECT p.id, v.sku, v.name, v.slug, true, true, false, v.sort_order
FROM (VALUES
  ('CAT-HERR', 'CAT-HERR-ELEC', 'Eléctricas', 'herramientas-electricas', 11),
  ('CAT-HERR', 'CAT-HERR-MAN', 'Manuales', 'herramientas-manuales', 12),
  ('CAT-FERR', 'CAT-FERR-FIJ', 'Fijaciones', 'fijaciones', 21),
  ('CAT-FERR', 'CAT-FERR-ABR', 'Abrasivos', 'abrasivos', 22)
) AS v(parent_sku, sku, name, slug, sort_order)
JOIN categories p ON p.sku = v.parent_sku
ON CONFLICT (sku) DO NOTHING;
