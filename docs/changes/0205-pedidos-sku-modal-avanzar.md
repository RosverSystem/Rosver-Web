# Cambio: SKU en productos + modal al avanzar fase

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Productos del pedido: **nombre + SKU + código interno** (ya no el slug).
- Cliente: razón social (no solo el teléfono de la URL).
- **Avanzar** abre `AdminModal` para completar datos de la fase destino (pago / envío / voucher / entrega).

## Archivos

- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/src/features/admin-orders/ui/AdminOrderWorkspacePage.tsx`
- `docs/changes/0205-pedidos-sku-modal-avanzar.md`

## Cómo verificar

- [ ] Recargar vista pedido: SKU bajo el nombre del producto.
- [ ] Cabecera muestra nombre del cliente.
- [ ] Avanzar → modal con campos de esa fase → Guardar y avanzar.
