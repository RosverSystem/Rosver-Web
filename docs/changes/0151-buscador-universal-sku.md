# Cambio: buscador universal + salto por SKU

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- El buscador del header (desktop + móvil) **sí busca**: Enter o botón rojo.
- Búsqueda universal parcial: nombre, SKU, marca, descripción, categoría, origen, specs.
- Si el query coincide con un **SKU/código único** (ej. `SKU213`, `RS-1042`) → abre `/producto/:slug` directo.
- Si no → `/catalogo?q=…` con resultados filtrados y chip para quitar búsqueda.

## Por qué

El input era solo visual; se pedía coincidencia mínima y acceso directo por código.

## Archivos

- `RosverSac/src/features/catalog/model/catalog-search.ts`
- `RosverSac/src/features/catalog/index.ts`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Buscar “tala” o fragmento de marca → lista en `/catalogo?q=`
- [ ] Buscar SKU exacto de un producto → ficha `/producto/…`
- [ ] Móvil: lupa del buscador envía la búsqueda
- [ ] “Quitar búsqueda” limpia `q`
