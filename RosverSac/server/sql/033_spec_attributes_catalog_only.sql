-- Datos de tienda (SKU, marca, origen, MOQ) NO van en el módulo Especificaciones.
-- Esos salen de campos del producto en «Especificaciones de tienda».
-- Solo ficha técnica (voltaje, medidas, etc.) es gestionable en /admin/especificaciones.

ALTER TABLE spec_attributes
  ADD COLUMN IF NOT EXISTS is_catalog BOOLEAN NOT NULL DEFAULT true;

UPDATE spec_attributes
SET is_catalog = false,
    is_system = false
WHERE key IN ('sku_display', 'brand_name', 'origin', 'moq');

UPDATE spec_attributes
SET is_catalog = true,
    is_system = true
WHERE key IN (
  'voltage',
  'dimensions',
  'weight',
  'power',
  'material',
  'color_temp'
);

COMMENT ON COLUMN spec_attributes.is_catalog IS
  'Si true, aparece en módulo Especificaciones y en fase Especs del producto.';
