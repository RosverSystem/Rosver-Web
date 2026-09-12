-- Pending registrations: cuentas no verificadas (TTL 24h).
-- Tras verificar → se mueven a users y se borra el pending.

CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS pending_registrations_expires_idx
  ON pending_registrations (expires_at);

-- Mover usuarios ya existentes sin verificar a pending (si tienen password).
INSERT INTO pending_registrations (id, email, password_hash, full_name, phone, created_at, expires_at)
SELECT
  u.id,
  lower(u.email),
  COALESCE(u.password_hash, ''),
  COALESCE(u.full_name, split_part(u.email, '@', 1)),
  COALESCE(u.phone, ''),
  u.created_at,
  u.created_at + INTERVAL '24 hours'
FROM users u
WHERE u.email_verified_at IS NULL
  AND u.password_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pending_registrations p WHERE p.email = lower(u.email)
  )
ON CONFLICT (email) DO NOTHING;

-- Quitar de users las cuentas no verificadas (quedan solo en pending).
DELETE FROM sessions s
USING users u
WHERE s.user_id = u.id AND u.email_verified_at IS NULL;

DELETE FROM auth_otps o
USING users u
WHERE o.user_id = u.id AND u.email_verified_at IS NULL;

DELETE FROM oauth_accounts oa
USING users u
WHERE oa.user_id = u.id AND u.email_verified_at IS NULL;

DELETE FROM users WHERE email_verified_at IS NULL;
