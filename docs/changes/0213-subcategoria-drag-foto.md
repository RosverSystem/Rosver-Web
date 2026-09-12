# Cambio: Subcategoría en productos + drag-and-drop foto

**Fecha:** 2026-09-10  
**Tipo:** feature | fix

## Qué cambió

- Restaurado `/admin/productos` tras pérdida de trabajo local: listado **BootstrapTable** (thumb, código interno, SKU, marca, categoría, Visible/Oculto/Destacado, iconos Pen/Trash), búsqueda diferida, filtro de visibilidad y paginación (10).
- Wizard: **código interno** solo lectura (`formatInternalCode` + preview `peekNextInternalCode` / `GET /api/admin/products/next-code`).
- Wizard: selects separados **Categoría** (raíz) y **Subcategoría** (hijos); al guardar se usa `assignedCategoryId = subcategoryId || parentCategoryId`.
- Confirmado: `AdminImageUpload` ya soporta **arrastrar y soltar** imagen (R2) además del selector de medios.

## Por qué

El archivo se sobrescribió y se recuperó un commit viejo (~lista simple + un solo select de categoría). Había que recuperar la UI ERP alineada a Pedidos/Reclamaciones y permitir asignar subcategoría sin mezclar en un único select.

## Cómo

- Listado: mismo patrón que reclamaciones/cotizaciones (`BootstrapTable`, `IconAction`, `useDeferredValue`).
- Categorías: `rootCategories` (`!parentId`) + `subCategories` filtradas por padre; `applyCategoryFromProduct` al editar.
- Foto: sin cambios nuevos en upload — drag-drop ya estaba en `admin-image-upload.tsx`.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/shared/ui/admin-image-upload.tsx` (verificado; sin cambio requerido)
- `docs/changes/0213-subcategoria-drag-foto.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/productos` muestra tabla Bootstrap con miniatura y paginación
- [ ] Buscar por nombre/SKU/código/marca/categoría; filtro Visibles/Ocultos/Todos
- [ ] Nuevo producto: código interno 8 dígitos, solo lectura, fondo soft
- [ ] Categoría + Subcategoría en dos selects; guardar asigna la sub si hay, si no la raíz
- [ ] Editar producto: carga categoría/sub según el `categoryId` guardado
- [ ] Arrastrar imagen al campo foto del wizard sube a R2
- [ ] Wizard fases (Datos → Detalle → Precios → Especs) y soft-delete intactos
- [ ] _(UI)_ Móvil / tablet / desktop (scroll horizontal de tabla en móvil OK)
