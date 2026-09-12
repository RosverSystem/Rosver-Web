-- Presentaciones Paquete / Caja + precios por unidad (demo RS-5402).
-- Tipos de unidad ya existen en 002 (unidad, paquete, caja).
-- Idempotente: no duplica empaques ni precios activos.

-- Paquete (6 und) — RS-5402
INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
SELECT p.id, ut.id, 6, 'Paquete', false
FROM products p
JOIN unit_types ut ON ut.code = 'paquete'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, unit_type_id, content_qty) DO NOTHING;

-- Caja (12 und) — RS-5402
INSERT INTO product_packagings (product_id, unit_type_id, content_qty, label, is_default)
SELECT p.id, ut.id, 12, 'Caja', false
FROM products p
JOIN unit_types ut ON ut.code = 'caja'
WHERE p.sku = 'RS-5402'
ON CONFLICT (product_id, unit_type_id, content_qty) DO NOTHING;

-- Mayorista en Unidad (default)
INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, is_active
)
SELECT p.id, pk.id, 'wholesale', 1, 62.56, true
FROM products p
JOIN product_packagings pk ON pk.product_id = p.id AND pk.is_default = true
WHERE p.sku = 'RS-5402'
  AND NOT EXISTS (
    SELECT 1 FROM product_prices pr
    WHERE pr.packaging_id = pk.id AND pr.price_kind = 'wholesale' AND pr.is_active
  );

-- Lista + mayorista Paquete
INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active
)
SELECT p.id, pk.id, 'list', 1, 380.00, 420.00, true
FROM products p
JOIN product_packagings pk
  ON pk.product_id = p.id AND pk.label = 'Paquete' AND pk.content_qty = 6
WHERE p.sku = 'RS-5402'
  AND NOT EXISTS (
    SELECT 1 FROM product_prices pr
    WHERE pr.packaging_id = pk.id AND pr.price_kind = 'list' AND pr.is_active
  );

INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, is_active
)
SELECT p.id, pk.id, 'wholesale', 1, 350.00, true
FROM products p
JOIN product_packagings pk
  ON pk.product_id = p.id AND pk.label = 'Paquete' AND pk.content_qty = 6
WHERE p.sku = 'RS-5402'
  AND NOT EXISTS (
    SELECT 1 FROM product_prices pr
    WHERE pr.packaging_id = pk.id AND pr.price_kind = 'wholesale' AND pr.is_active
  );

-- Lista + mayorista Caja
INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, compare_at_amount, is_active
)
SELECT p.id, pk.id, 'list', 1, 720.00, 780.00, true
FROM products p
JOIN product_packagings pk
  ON pk.product_id = p.id AND pk.label = 'Caja' AND pk.content_qty = 12
WHERE p.sku = 'RS-5402'
  AND NOT EXISTS (
    SELECT 1 FROM product_prices pr
    WHERE pr.packaging_id = pk.id AND pr.price_kind = 'list' AND pr.is_active
  );

INSERT INTO product_prices (
  product_id, packaging_id, price_kind, min_qty, amount, is_active
)
SELECT p.id, pk.id, 'wholesale', 1, 660.00, true
FROM products p
JOIN product_packagings pk
  ON pk.product_id = p.id AND pk.label = 'Caja' AND pk.content_qty = 12
WHERE p.sku = 'RS-5402'
  AND NOT EXISTS (
    SELECT 1 FROM product_prices pr
    WHERE pr.packaging_id = pk.id AND pr.price_kind = 'wholesale' AND pr.is_active
  );
