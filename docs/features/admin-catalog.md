# Feature: Admin — catálogo

**Slug:** `features/admin-catalog/`  
**Estado:** activa (wireframe de baja fidelidad; diseño final pendiente)

## Propósito

CRUD de productos y categorías que alimentan el catálogo público.

## Rutas

`/admin/productos`, nuevo, edición, `/admin/categorias`.

## Flujos

`03-vistas-y-flujos.md` → F7.

## Verificación

- [x] Listado + formulario producto (UI) — `AdminProductsPage`, `AdminProductFormPage` (compartido nuevo/edición vía `:id`)
- [x] Toggle visible / destacado (UI, checkboxes en el formulario)
- [x] `AdminCategoriesPage` — listado de categorías reales de `catalog`
- [ ] Reemplazar `WireBlock`/`WireImage` por diseño final
