# Cambio: Pedidos admin — tabla Bootstrap + CRUD

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Se retiró el tablero Kanban de `/admin/pedidos` (por ahora).
- Listado en tabla Bootstrap (`BootstrapTable`) con cabecera oscura, badges de fase a color Rosver y acciones.
- Buscador (código, cliente, teléfono, distrito, agencia) + filtro por fase.
- Paginación cliente (10 filas por página).
- Modal **Ver detalles**: destino, link público, cambio de fase (`PATCH`).
- Confirmación + **Eliminar** pedido (`DELETE /api/admin/orders/:id`).
- El alta de pedidos sigue desde el carrito / link público (no hay “Crear” en admin).

## Por qué

El Kanban se veía vacío/poco usable; se pidió tabla con diseño más colorido, búsqueda, paginación, detalle y CRUD.

## Cómo

- UI: `AdminOrdersPage` reescrita sobre `BootstrapTable` + `AdminModal`.
- API: `DELETE` en `adminOrdersRoutes` (mismo guard admin que list/patch).
- Create = flujo público existente; Update = fase; Delete = hard delete en `order_requests`.

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/server/src/routes/orders.ts`
- `docs/changes/0197-pedidos-tabla-bootstrap-crud.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Abrir Vite `http://localhost:5173/admin/pedidos` (no solo `:8787` sin rebuild).
- [ ] Ver tabla con pedidos; badges de fase con color.
- [ ] Buscar por código/cliente; filtrar por fase; paginar si hay >10.
- [ ] **Ver detalles** → cambiar fase → toast éxito y badge actualizado.
- [ ] **Eliminar** → confirmar → desaparece del listado.
- [ ] Móvil: scroll horizontal de tabla + filtros apilados.
- [ ] Tablet / desktop: filtros en fila y acciones visibles.
- [ ] Si usás `:8787`, correr `npx vite build` para refrescar `dist/`.
