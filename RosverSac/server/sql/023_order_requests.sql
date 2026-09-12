-- Pedidos (carrito → Continuar pedido). Distinto de quote_requests (cotizar).
CREATE TABLE IF NOT EXISTS order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  document_number TEXT,
  phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_estimated NUMERIC(12, 2),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  public_slug TEXT,
  link_expires_at TIMESTAMPTZ,
  pdf_bytes BYTEA,
  pdf_r2_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS order_requests_code_seq START 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_requests_public_slug
  ON order_requests (public_slug)
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_requests_created
  ON order_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_requests_link_expires
  ON order_requests (link_expires_at)
  WHERE link_expires_at IS NOT NULL;
