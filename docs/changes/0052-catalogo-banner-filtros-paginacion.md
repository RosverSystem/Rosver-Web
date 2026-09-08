# Cambio: Catálogo moderno (banner, filtros, paginación, Motion)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Banner claro/bold `CatalogBanner`: “Nuestros productos” + breadcrumbs + Motion.
- `FiltersPanel` ampliado (categorías, oferta, precio/cotizar, rating, proveedores) + drawer móvil + chips limpiables.
- `CatalogPagination` circular (estilo shop) con flechas; 6 productos por página.
- `CatalogPage`: orden real (precio, nombre, rating), filtrado mock, contador “mostrando X–Y de Z”.
- `ProductGrid` con stagger Motion; `ProductCard` más limpia (badge, quick actions, categoría + rating).

## Por qué

Se pidió alinear el listado a una referencia shop moderna (filtros + paginación + banner), conservando paleta Rosver y animaciones Motion.

## Cómo

Sin tablas HTML (no encajan en catálogo e-commerce): grid + paginación. Filtros en estado local (fase visual).

## Archivos

- `RosverSac/src/features/catalog/ui/CatalogBanner.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPagination.tsx`
- `RosverSac/src/features/catalog/ui/FiltersPanel.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `RosverSac/src/features/catalog/ui/ProductGrid.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0052-catalogo-banner-filtros-paginacion.md`

## Cómo verificar

- [ ] `/catalogo` muestra banner “Nuestros productos”
- [ ] Filtros laterales (desktop) y “Filtrar” drawer (móvil) funcionan
- [ ] Chips rojos + “Limpiar todo”; orden cambia listado
- [ ] Paginación circular (con 8 mocks y page size 6 hay 2 páginas)
- [ ] Cards entran con stagger; hover muestra acciones
- [ ] Móvil / tablet / desktop OK; sin scroll horizontal
- [ ] Paleta Rosver (rojo), no verde de la referencia
