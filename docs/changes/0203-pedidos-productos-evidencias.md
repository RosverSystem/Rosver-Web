# Cambio: Productos + evidencias por fase en pedido

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Vista `/admin/pedidos/vista`: tabla **Productos del pedido** (nombre, presentación, cant., precios, foto catálogo).
- Evidencias obligatorias al avanzar fase:
  - **Pago** → captura (imagen/PDF)
  - **Envío** → agencia/courier + nota
  - **Enviado** → nº de guía y/o voucher
  - **Entregado** → prueba de entrega
- Archivos en R2 bajo `orders/evidence/{orderId}/…` (aparte de products/brands/avatars).
- Migración `026_order_pipeline_evidence.sql`.
- API: `GET /by-code/:code`, `POST /:id/evidence`, `PATCH` con validación de evidencias.

## Por qué

El vendedor debe ver qué pidieron y adjuntar pruebas en cada fase sin mezclar medios del catálogo.

## Archivos

- `RosverSac/server/sql/026_order_pipeline_evidence.sql`
- `RosverSac/server/src/lib/upload-order-evidence.ts`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/src/features/admin-orders/ui/AdminOrderWorkspacePage.tsx`
- `docs/features/admin-orders.md`
- `docs/changes/0203-pedidos-productos-evidencias.md`

## Cómo verificar

- [ ] Reiniciar API / boot para aplicar migración `026`.
- [ ] Abrir vista pedido → ver productos detallados.
- [ ] Sin captura de pago → Avanzar a pago falla con toast.
- [ ] Subir captura → avanzar OK; voucher/tracking para enviado; prueba para entregado.
- [ ] En R2, claves bajo `orders/evidence/…`.
- [ ] Móvil / tablet / desktop usable.
