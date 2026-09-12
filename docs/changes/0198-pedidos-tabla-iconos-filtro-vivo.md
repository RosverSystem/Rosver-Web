# Cambio: Pedidos admin — columnas compactas + iconos CRUD

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Tabla de pedidos solo con: **Código**, **Cliente**, **Fecha**, **Fase**.
- Acciones CRUD con iconos cssvg: ver (`Monitor`), editar (`Pen`), eliminar (`Trash`).
- Buscador con icono; **filtra la tabla mientras se escribe** (también por fase).
- Cabecera y badges con más color Rosver; destino/total quedan en el modal de detalle.

## Por qué

Pedido de UX: tabla más simple, iconos en lugar de botones de texto, y filtro en vivo.

## Cómo

- `AdminOrdersPage` + `useDeferredValue` en el query.
- Ver = modal lectura; Editar = mismo modal con select de fase habilitado.
- Create sigue desde el carrito (sin botón + en admin).

## Archivos

- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `docs/changes/0198-pedidos-tabla-iconos-filtro-vivo.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/pedidos`: solo columnas Código / Cliente / Fecha / Fase + iconos.
- [ ] Escribir en el buscador → filas se reducen al instante.
- [ ] Icono azul = detalle; amarillo = editar fase; rojo = eliminar.
- [ ] Móvil / tablet / desktop: tabla usable (scroll horizontal si hace falta).
