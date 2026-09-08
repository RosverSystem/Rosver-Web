# 0031 — Diseño catálogo con imágenes de producto

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `Product`: campos `id`, `imageUrl?`, `visible?`; mocks con fotos Unsplash.
- `ProductImage`: componente con foto o placeholder.
- `ProductCard` / `ProductGrid` / `ProductPage` / `CatalogPage` / `FiltersPanel` rediseñados (fotos, banner de categoría, sidebar con thumbs + conteo, toolbar ordenar, empty state, breadcrumbs).
- Doc ERP ampliado en `07-categorias-imagen-erp.md` (sección productos).

## Por qué

El listado del catálogo seguía con placeholders grises; se necesita ver el diseño con imágenes y dejar el modelo listo para el ERP.

## Cómo

- Misma idea que categorías: `imageUrl` opcional, lazy load, aspect-ratio fijo.
- Sidebar muestra miniatura de categoría y cantidad de productos.
- Banner de categoría cuando hay `imageUrl` en la categoría activa.

## Archivos

- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/ui/ProductImage.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/ProductGrid.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `RosverSac/src/features/catalog/ui/FiltersPanel.tsx`
- `docs/architecture/02-producto-rosver-sac.md`
- `docs/architecture/07-categorias-imagen-erp.md`

## Cómo verificar

- [ ] `/catalogo` muestra grid con fotos reales (mock)
- [ ] Filtrar por categoría: banner + productos de esa categoría
- [ ] Sidebar con thumbs y contadores
- [ ] Ficha `/producto/:slug` con imagen grande
- [ ] _(UI)_ Móvil 2 cols / tablet 3 / desktop 3–4
- [ ] _(UI)_ Lazy load en listado; ficha con eager en principal
