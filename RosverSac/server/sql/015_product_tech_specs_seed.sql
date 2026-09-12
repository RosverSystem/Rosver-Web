-- Specs técnicas de ejemplo (RS-5402) + atributos material / temperatura.
-- Idempotente.

INSERT INTO spec_attributes (key, name, value_type, unit_hint, sort_order)
VALUES
  ('material', 'Material', 'text', NULL, 20),
  ('color_temp', 'Temperatura de color', 'measure', 'K', 21)
ON CONFLICT (key) DO NOTHING;

-- Dimensiones
INSERT INTO product_spec_values (product_id, attribute_id, value_text, unit)
SELECT p.id, a.id, '420 x 180 x 120', 'mm'
FROM products p
JOIN spec_attributes a ON a.key = 'dimensions'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, attribute_id) DO UPDATE
  SET value_text = EXCLUDED.value_text, unit = EXCLUDED.unit;

-- Peso
INSERT INTO product_spec_values (product_id, attribute_id, value_number, unit)
SELECT p.id, a.id, 0.85, 'kg'
FROM products p
JOIN spec_attributes a ON a.key = 'weight'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, attribute_id) DO UPDATE
  SET value_number = EXCLUDED.value_number, unit = EXCLUDED.unit;

-- Potencia
INSERT INTO product_spec_values (product_id, attribute_id, value_number, unit)
SELECT p.id, a.id, 8, 'W'
FROM products p
JOIN spec_attributes a ON a.key = 'power'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, attribute_id) DO UPDATE
  SET value_number = EXCLUDED.value_number, unit = EXCLUDED.unit;

-- Material
INSERT INTO product_spec_values (product_id, attribute_id, value_text)
SELECT p.id, a.id, 'ABS + aluminio'
FROM products p
JOIN spec_attributes a ON a.key = 'material'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, attribute_id) DO UPDATE
  SET value_text = EXCLUDED.value_text;

-- Temperatura de color
INSERT INTO product_spec_values (product_id, attribute_id, value_text, unit)
SELECT p.id, a.id, '3000 / 4000 / 6500', 'K'
FROM products p
JOIN spec_attributes a ON a.key = 'color_temp'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, attribute_id) DO UPDATE
  SET value_text = EXCLUDED.value_text, unit = EXCLUDED.unit;
