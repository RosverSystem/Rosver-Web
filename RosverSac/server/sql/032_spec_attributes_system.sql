-- Tipos de especificación técnica: marcar defaults del sistema (no borrar).
-- Nota: SKU/marca/origen/MOQ NO son catálogo (ver 033); solo ficha técnica.
ALTER TABLE spec_attributes
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

UPDATE spec_attributes
SET is_system = true
WHERE key IN (
  'voltage',
  'dimensions',
  'weight',
  'power',
  'material',
  'color_temp'
);

COMMENT ON COLUMN spec_attributes.is_system IS
  'Default técnico del catálogo: no se elimina; key no se renombra.';
