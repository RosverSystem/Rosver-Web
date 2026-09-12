# Cambio: Modal editar pedido más grande y datos arriba

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Modal de ver/editar pedido en `size="xl"` (más ancho).
- Bloque oscuro arriba con cliente, código, total, fase, fecha e ítems.
- Destino y link en dos columnas; fase debajo; acciones en footer fijo.
- `AdminModal` xl pasa de `max-w-4xl` a `max-w-5xl`.

## Por qué

El modal se veía chico, con scroll y datos apretados abajo.

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/src/shared/ui/admin-modal.tsx`
- `docs/changes/0200-pedidos-modal-editar-grande.md`

## Cómo verificar

- [ ] Abrir editar/ver en `/admin/pedidos`: modal ancho.
- [ ] Datos del cliente y total visibles arriba sin buscar scroll.
- [ ] Footer con Cerrar / Editar fase / Eliminar fijo.
- [ ] Móvil: modal full-width; tablet/desktop: dos columnas destino/link.
