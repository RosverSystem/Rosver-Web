-- Pipeline comercial de cotizaciones + evidencias (R2: quotes/evidence/).
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'recibida',
  ADD COLUMN IF NOT EXISTS revision_note TEXT,
  ADD COLUMN IF NOT EXISTS response_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS response_proof_key TEXT,
  ADD COLUMN IF NOT EXISTS response_note TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_proof_key TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_note TEXT,
  ADD COLUMN IF NOT EXISTS close_note TEXT;

DO $$
BEGIN
  ALTER TABLE quote_requests
    DROP CONSTRAINT IF EXISTS quote_requests_status_check;
  ALTER TABLE quote_requests
    ADD CONSTRAINT quote_requests_status_check
    CHECK (
      status IN (
        'recibida',
        'en_revision',
        'respondida',
        'aceptada',
        'cerrada'
      )
    );
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_requests_status
  ON quote_requests (status);
