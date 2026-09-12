-- Link público temporal (15 días) + PDF de cotización.
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS link_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_bytes BYTEA,
  ADD COLUMN IF NOT EXISTS pdf_r2_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_requests_public_slug
  ON quote_requests (public_slug)
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_link_expires
  ON quote_requests (link_expires_at)
  WHERE link_expires_at IS NOT NULL;
