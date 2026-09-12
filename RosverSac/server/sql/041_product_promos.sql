-- Motor de promociones 2x1 (BOGO) por producto/empaque.
-- Idempotente.

CREATE TABLE IF NOT EXISTS product_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Empaque específico al que aplica; NULL = aplica a cualquier empaque del producto
  packaging_id UUID REFERENCES product_packagings(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'bogo'
    CHECK (kind IN ('bogo')),
  -- BOGO: compra buy_qty, paga pay_qty (ej. 2x1 → buy_qty=2, pay_qty=1)
  buy_qty INT NOT NULL DEFAULT 2 CHECK (buy_qty >= 2),
  pay_qty INT NOT NULL DEFAULT 1 CHECK (pay_qty >= 1 AND pay_qty < buy_qty),
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  -- Notas internas (admin)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un solo BOGO activo por producto+empaque
  CONSTRAINT product_promos_unique_active UNIQUE (product_id, packaging_id, kind)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_product_promos_product
  ON product_promos (product_id, active)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_product_promos_active_dates
  ON product_promos (active, valid_from, valid_to)
  WHERE active = true;
