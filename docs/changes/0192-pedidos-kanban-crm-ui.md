# Cambio: Pedidos Kanban estilo CRM (Bitrix-like)

**Fecha:** 2026-09-10  
**Tipo:** refactor

## Qué cambió

- `/admin/pedidos`: tablero Kanban más cercano a CRM (cabecera de color por fase, total S/ por columna, cards blancas con monto destacado).
- Buscador por código / cliente / teléfono.
- Contador y total general en el header.
- Paleta solo tokens Rosver (azul / amarillo / ink / rojo / success).

## Por qué

Rosa pidió el look tipo pipeline Bitrix24 sobre el Kanban ya funcional (0191).

## Cómo

Rediseño UI de `AdminOrdersPage`; misma API y estados.

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `docs/changes/0192-pedidos-kanban-crm-ui.md`

## Cómo verificar

- [ ] `/admin/pedidos`: 5 columnas con barra de color distinta
- [ ] Cada columna muestra suma S/ de sus pedidos
- [ ] Card: cliente, monto, fecha, Avanzar / Detalle
- [ ] Buscador filtra cards
- [ ] Móvil: scroll horizontal del tablero
- [ ] Tablet / desktop: columnas fijas ~280px
