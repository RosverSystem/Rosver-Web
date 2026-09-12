-- Evidencias del pipeline (pago / envío / voucher / entrega).
-- Separadas de productos, marcas, categorías y avatares (R2 prefix orders/evidence/).
ALTER TABLE order_requests
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_key TEXT,
  ADD COLUMN IF NOT EXISTS payment_note TEXT,
  ADD COLUMN IF NOT EXISTS ship_carrier TEXT,
  ADD COLUMN IF NOT EXISTS ship_data_note TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_voucher_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_voucher_key TEXT,
  ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_proof_key TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT;
