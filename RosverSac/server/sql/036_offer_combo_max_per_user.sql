-- Límite de compra por usuario en combos de oferta.
-- NULL = sin límite. Idempotente.

ALTER TABLE offer_combos
  ADD COLUMN IF NOT EXISTS max_per_user INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offer_combos_max_per_user_chk'
  ) THEN
    ALTER TABLE offer_combos
      ADD CONSTRAINT offer_combos_max_per_user_chk
      CHECK (max_per_user IS NULL OR max_per_user >= 1);
  END IF;
END $$;
