# Cambio: Colores por fase de pedidos

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Cada fase del pipeline tiene un **badge de color sólido** Rosver (ya no gris casi invisible).
- Mapa central `ORDER_PIPELINE_BADGE` en `shared/lib/order-pipeline.ts`.

| Fase | Color |
| --- | --- |
| Confirmación de pedido | Azul (`rosver-blue`) |
| Confirmación de pago | Amarillo (`rosver-yellow`) |
| Realizando envío | Negro (`rosver-ink`) |
| Enviado | Rojo (`rosver-red`) |
| Entregado | Verde (`rosver-success`) |

## Por qué

El badge de “Confirmación de pedido” se veía gris/blanco y no se diferenciaba.

## Cómo

Token único reutilizable; la tabla admin lo consume.

## Archivos

- `RosverSac/src/shared/lib/order-pipeline.ts`
- `RosverSac/src/features/admin-orders/model/order-pipeline.ts`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `docs/changes/0199-pedidos-colores-fase.md`

## Cómo verificar

- [ ] En `/admin/pedidos`, “Confirmación de pedido” es **azul con texto blanco**.
- [ ] Cambiar fase en el modal y ver que el badge cambia de color.
- [ ] Móvil / tablet / desktop: badges legibles.
