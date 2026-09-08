CREATE TABLE IF NOT EXISTS price_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_id UUID,
  packaging_id UUID,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deactivated')),
  old_amount NUMERIC(18, 4),
  new_amount NUMERIC(18, 4),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_audit_product_id ON price_audit (product_id, created_at DESC);
