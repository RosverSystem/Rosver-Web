# Cambio: Categorías UX + presentaciones código/cantidad

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

### Categorías (admin + tienda)
- «Nueva categoría» crea siempre la principal; subcategoría desde el pie de cada card.
- Acciones CRUD con iconos (`Pen` / `Trash` / `Plus`); sin select de ubicación.
- Filtro catálogo: categorías generales colapsables y selección con checkbox.
- Mega-menú «Ver categorías»: subcategorías clicables siempre bajo su padre.

### Presentaciones (cantidades)
- Modal cantidad: **código interno** automático (como productos), **tipo de unidad** solo lectura, solo se edita **cantidad**.
- Modal tipo de unidad: código auto (slug) en solo lectura; se edita el nombre.
- Migración `029_unit_type_quantity_code.sql` + `GET /api/admin/unit-type-quantities/next-code`.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminUnitQtyCascade.tsx`
- `RosverSac/src/features/catalog/ui/FiltersPanel.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/server/sql/029_unit_type_quantity_code.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `docs/changes/0217-categorias-filtros-presentaciones-codigo.md`

## Cómo verificar

- [ ] Admin categorías: iconos editar/borrar; «Agregar subcategoría» abajo de la card
- [ ] Filtro `/catalogo`: expandir padre + check en padre/hijo
- [ ] Topbar: clic en subcategoría navega a `/catalogo/{slug}`
- [ ] Presentaciones → Nueva cantidad: código `0000000N`, tipo bloqueado, solo cantidad editable
- [ ] Móvil / tablet / desktop OK
