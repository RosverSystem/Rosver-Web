-- Código interno de producto: secuencia desde 0 (display 8 dígitos: 00000000, 00000001…).
-- El valor sigue siendo INT; la UI/API lo muestra con ceros a la izquierda.

DO $$
DECLARE
  seq_name text;
  max_code bigint;
BEGIN
  SELECT pg_get_serial_sequence('products', 'code') INTO seq_name;
  IF seq_name IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER SEQUENCE %s MINVALUE 0 NO CYCLE', seq_name);

  SELECT COALESCE(MAX(code), -1) INTO max_code FROM products;
  -- is_called = true → el próximo nextval es max_code + 1 (o 0 si no hay filas)
  EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_code);
END $$;
