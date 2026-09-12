-- Mensajes del formulario de contacto (/contacto).
-- Idempotente.

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_type TEXT CHECK (document_type IS NULL OR document_type IN ('DNI', 'RUC')),
  document_number TEXT,
  business_name TEXT,
  message TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmation_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created
  ON contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email
  ON contact_messages (email)
  WHERE email IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS contact_messages_code_seq START 1;
