-- Seed 3 productos en oferta (idempotente por SKU).
-- Precios: lista (normal) + offer (rebaja) en empaque Unidad.

-- Categoría hogar si falta (para lámpara)
INSERT INTO categories (
  parent_id, sku, name, slug, image_url, visible, show_in_nav, show_on_home,
  tagline, highlight_points, sort_order
) VALUES (
  NULL, 'CAT-HOGAR', 'Hogar', 'hogar',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&h=480&q=75',
  true, true, true,
  'Iluminación y hogar',
  '["Importación continua","Stock listo","Asesoría"]'::jsonb,
  50
)
ON CONFLICT (sku) DO NOTHING;

-- Productos oferta
INSERT INTO products (
  sku, slug, name, brand_id, category_id, description, origin, moq,
  availability, featured, visible, image_url, rating, review_count
)
SELECT
  v.sku, v.slug, v.name, b.id, c.id, v.description, v.origin, 1,
  'in_stock', false, true, v.image_url, v.rating, v.reviews
FROM (VALUES
  (
    'RS-4201',
    'multimetro-digital-cat-iii',
    'Multímetro digital CAT III',
    'TOTAL',
    'CAT-ELEC',
    'Multímetro digital auto-rango, display LCD, puntas incluidas.',
    'China',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=640&h=640&q=75',
    4.6::numeric,
    18
  ),
  (
    'RS-5402',
    'lampara-escritorio-led',
    'Lámpara de escritorio LED',
    'INGCO',
    'CAT-HOGAR',
    'Lámpara LED brazo flexible, 3 temperaturas de color, USB.',
    'China',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=640&h=640&q=75',
    4.4::numeric,
    12
  ),
  (
    'RS-1042',
    'taladro-percutor-inalambrico-20v',
    'Taladro percutor inalámbrico 20V',
    'BOSCH',
    'CAT-HERR',
    'Taladro percutor inalámbrico 20V con batería de litio, mandril de 13mm y maletín. Ideal para uso doméstico e industrial.',
    'China',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=640&q=75',
    4.8::numeric,
    42
  )
) AS v(sku, slug, name, brand_sku, cat_sku, description, origin, image_url, rating, reviews)
JOIN brands b ON b.sku = v.brand_sku
JOIN categories c ON c.sku = v.cat_sku
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = COALESCE(products.image_url, EXCLUDED.image_url),
  brand_id = EXCLUDED.brand_id,
  category_id = EXCLUDED.category_id,
  visible = true,
  updated_at = now();

-- Empaque Unidad por defecto
INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
SELECT p.id, ut.id, 1, 'Unidad', true
FROM products p
CROSS JOIN LATERAL (
  SELECT id FROM unit_types WHERE is_base = true ORDER BY sort_order LIMIT 1
) ut
WHERE p.sku IN ('RS-4201', 'RS-5402', 'RS-1042')
ON CONFLICT (product_id, unit_type_id, content_qty) DO NOTHING;

-- Precio lista (normal) + compare_at
INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active
)
SELECT
  p.id,
  pk.id,
  'list',
  1,
  v.list_amount,
  v.compare_at,
  true
FROM (VALUES
  ('RS-4201', 99.00::numeric, 99.00::numeric),
  ('RS-5402', 85.00::numeric, 85.00::numeric),
  ('RS-1042', 289.00::numeric, 289.00::numeric)
) AS v(sku, list_amount, compare_at)
JOIN products p ON p.sku = v.sku
JOIN product_packagings pk ON pk.product_id = p.id AND pk.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM product_prices pr
  WHERE pr.product_id = p.id AND pr.packaging_id = pk.id
    AND pr.price_kind = 'list' AND pr.is_active
);

-- Precio oferta
INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active
)
SELECT
  p.id,
  pk.id,
  'offer',
  1,
  v.offer_amount,
  v.list_amount,
  true
FROM (VALUES
  ('RS-4201', 79.00::numeric, 99.00::numeric),
  ('RS-5402', 68.00::numeric, 85.00::numeric),
  ('RS-1042', 249.00::numeric, 289.00::numeric)
) AS v(sku, offer_amount, list_amount)
JOIN products p ON p.sku = v.sku
JOIN product_packagings pk ON pk.product_id = p.id AND pk.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM product_prices pr
  WHERE pr.product_id = p.id AND pr.packaging_id = pk.id
    AND pr.price_kind = 'offer' AND pr.is_active
);

-- Alinear compare_at del list activo con el precio normal
UPDATE product_prices pr
SET compare_at_amount = CASE p.sku
      WHEN 'RS-4201' THEN 99.00
      WHEN 'RS-5402' THEN 85.00
      WHEN 'RS-1042' THEN 289.00
    END,
    amount = CASE p.sku
      WHEN 'RS-4201' THEN 99.00
      WHEN 'RS-5402' THEN 85.00
      WHEN 'RS-1042' THEN 289.00
    END,
    updated_at = now()
FROM products p
WHERE pr.product_id = p.id
  AND p.sku IN ('RS-4201', 'RS-5402', 'RS-1042')
  AND pr.price_kind = 'list'
  AND pr.is_active = true;
