-- Libro de reclamaciones (Perú — Código de Protección y Defensa del Consumidor)
-- Idempotente.

CREATE SEQUENCE IF NOT EXISTS consumer_complaints_code_seq;

CREATE TABLE IF NOT EXISTS consumer_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  claim_kind TEXT NOT NULL
    CHECK (claim_kind IN ('reclamo', 'queja')),
  good_kind TEXT NOT NULL
    CHECK (good_kind IN ('producto', 'servicio')),
  consumer_name TEXT NOT NULL,
  consumer_doc_type TEXT NOT NULL
    CHECK (consumer_doc_type IN ('DNI', 'CE', 'RUC', 'PASAPORTE')),
  consumer_doc_number TEXT NOT NULL,
  consumer_address TEXT NOT NULL,
  consumer_district TEXT,
  consumer_province TEXT,
  consumer_department TEXT,
  consumer_phone TEXT NOT NULL,
  consumer_email TEXT NOT NULL,
  consumer_is_minor BOOLEAN NOT NULL DEFAULT false,
  guardian_name TEXT,
  guardian_doc_type TEXT
    CHECK (guardian_doc_type IS NULL OR guardian_doc_type IN ('DNI', 'CE', 'RUC', 'PASAPORTE')),
  guardian_doc_number TEXT,
  contracted_detail TEXT NOT NULL,
  amount NUMERIC(12, 2),
  claim_detail TEXT NOT NULL,
  consumer_request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recibido'
    CHECK (status IN ('recibido', 'en_revision', 'respondido', 'archivado')),
  provider_response TEXT,
  responded_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumer_complaints_created
  ON consumer_complaints (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consumer_complaints_status
  ON consumer_complaints (status);

CREATE INDEX IF NOT EXISTS idx_consumer_complaints_email
  ON consumer_complaints (lower(consumer_email));
