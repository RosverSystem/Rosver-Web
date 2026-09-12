# Cambio: Fase 4 specs — tipo, descripción libre, sin unidad, orden arrastrable

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- En ficha producto (Fase 4): botón **Agregar especificación**.
- **Tipo** se elige del catálogo (select); **Descripción** se escribe libre.
- Campo **Unidad** eliminado (el valor va completo en la descripción).
- Filas **arrastrables** para definir el orden en la ficha pública.
- API guarda `sort_order`; la tienda respeta ese orden.

## Por qué

Pedido UX: menos campos, elegir tipo, escribir valor tal cual y controlar el orden visual.

## Cómo

- Drag nativo por asa (icono menú); sin librería DnD.
- `PUT /products/:id/specs` acepta `sortOrder`.
- Tipos nuevos se crean en `/admin/especificaciones`, no inline en el producto.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminProductWorkspacePage.tsx`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/server/src/lib/catalog-products.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Producto → Fase 4: sin campo Unidad
- [ ] Agregar especificación → elegir Tipo → escribir Descripción
- [ ] Arrastrar filas y guardar; en ficha pública el orden coincide
- [ ] _(UI)_ Móvil / tablet / desktop
