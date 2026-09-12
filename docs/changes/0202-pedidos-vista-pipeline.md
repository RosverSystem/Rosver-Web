# Cambio: Pipeline en vista pedido + FAB volver atrás

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- `/admin/pedidos/vista` muestra el **pipeline de 5 fases** (tocar fase o Avanzar → `PATCH`).
- Resumen del pedido (cliente, total, destino, link).
- FAB rojo vuelve **atrás** (`history -1`) o a `/admin/pedidos` si no hay historial.
- Icono `Undo` (ya no Home → `/admin`).

## Por qué

Pedir trabajar el pipeline en esa vista y regresar a donde estaban (listado).

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrderWorkspacePage.tsx`
- `docs/features/admin-orders.md`
- `docs/changes/0202-pedidos-vista-pipeline.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Botón azul en pedidos → vista con pipeline.
- [ ] Tocar fase / Avanzar → badge y toast; listado refleja al volver.
- [ ] FAB → vuelve al listado de pedidos.
- [ ] Móvil: grid 2 cols de fases; tablet/desktop: 5 cols.
