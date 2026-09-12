-- P53: contact_messages → leads (status + note) + site_content table.
-- Idempotente.

-- 1. Add lead-management columns to contact_messages
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo', 'en_proceso', 'cerrado')),
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Index for status filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON contact_messages (status);

-- 3. Site content key-value store
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
