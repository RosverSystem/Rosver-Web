-- Pipeline CRM de pedidos (5 fases).
ALTER TABLE order_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmacion_pedido';

DO $$
BEGIN
  ALTER TABLE order_requests
    DROP CONSTRAINT IF EXISTS order_requests_status_check;
  ALTER TABLE order_requests
    ADD CONSTRAINT order_requests_status_check
    CHECK (
      status IN (
        'confirmacion_pedido',
        'confirmacion_pago',
        'realizando_envio',
        'enviado',
        'entregado'
      )
    );
END $$;

CREATE INDEX IF NOT EXISTS idx_order_requests_status
  ON order_requests (status);
