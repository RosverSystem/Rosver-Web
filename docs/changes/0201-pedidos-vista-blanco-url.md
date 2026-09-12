# Cambio: Vista en blanco de pedido (URL + FAB)

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- El botón azul (ver) en `/admin/pedidos` navega a una **pantalla completa en blanco** (sin sidebar ERP).
- URL: `/admin/pedidos/vista?codigo-pedido=PD-…&codcliente=…` (teléfono del cliente).
- Botón flotante rojo (Home) → vuelve a `/admin`.
- El lápiz amarillo sigue abriendo el modal de editar.

## Por qué

Necesitan un lienzo completo para diseñar después el detalle del pedido, con params en la URL.

## Cómo

- Ruta fuera de `AdminShell` + `RequireAdmin`.
- Página `AdminOrderWorkspacePage` vacía por ahora; lee los query params para uso futuro.

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrderWorkspacePage.tsx`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/src/features/admin-orders/index.ts`
- `RosverSac/src/app/App.tsx`
- `docs/features/admin-orders.md`
- `docs/changes/0201-pedidos-vista-blanco-url.md`

## Cómo verificar

- [ ] En pedidos, clic en botón azul → pantalla blanca full.
- [ ] URL con `codigo-pedido` y `codcliente`.
- [ ] FAB rojo abajo a la derecha → `/admin`.
- [ ] Móvil / tablet / desktop: FAB usable (≥44px).
