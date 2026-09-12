# Cambio: Pedidos Kanban estilo tablero limpio

**Fecha:** 2026-09-10  
**Tipo:** refactor

## Qué cambió

- `/admin/pedidos` rediseñado al estilo tablero tipo “Todo / In Progress”: columnas `bg-rosver-soft`, título **Fase (n)**, cards blancas con badge de estado.
- Sin barras de color Bitrix; badges discretos (Pedido / Pago / Envío / Enviado / Listo).
- Mismas 5 fases y acciones Avanzar / Detalle.

## Por qué

Rosa pidió el look del mock Kanban limpio (referencia Todo/In Progress/Review/Done).

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `docs/changes/0194-pedidos-kanban-tablero-limpio.md`

## Cómo verificar

- [ ] `/admin/pedidos`: columnas grises suaves, título con (conteo)
- [ ] Cards blancas con badge de color
- [ ] Avanzar / Detalle funcionan
- [ ] Móvil: scroll horizontal; tablet/desktop: 5 columnas
