# Cambio: Productos admin — tabla Bootstrap

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Listado `/admin/productos` pasa de filas simples a tabla Bootstrap (thumb, nombre + código interno, SKU, marca, categoría, badges Visible/Oculto/Destacado).
- Buscador con icono + filtro de visibilidad + paginación (10 por página).
- Acciones con iconos Pen / Trash (editar wizard / ocultar); el wizard de alta-edición no se tocó.

## Por qué

Paridad visual con Pedidos, Cotizaciones y Reclamaciones: listado ERP usable, no lista mínima de texto.

## Cómo

Solo UI de listado en `AdminProductsPage`: `BootstrapTable`, `useDeferredValue`, filtro `visibleFilter`. Create/edit/soft-delete y modal wizard siguen igual.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `docs/changes/0208-productos-tabla-bootstrap.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/productos` muestra tabla con miniatura y columnas claras
- [ ] Buscar por nombre/SKU/código/marca/categoría filtra en vivo
- [ ] Filtro Visibles / Ocultos / Todos funciona
- [ ] Paginación Anterior/Siguiente con conteo
- [ ] Editar abre el wizard XL; Ocultar confirma y soft-delete
- [ ] Nuevo producto sigue el wizard por fases
- [ ] _(UI)_ Móvil / tablet / desktop sin overflow roto (scroll horizontal de tabla en móvil OK)
