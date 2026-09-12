# Cambio: Presentaciones con precio en ficha + seed paquete/caja

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- En la ficha de producto, selector **Precio por presentación** (unidad / paquete / caja / las que haya) con precio visible; al elegir se lleva esa presentación al carrito.
- Seed `013_product_pack_prices_seed.sql`: en **RS-5402** quedan Paquete (×6) y Caja (×12) con precios lista y mayorista; mayorista en Unidad S/ 62.56.
- Scroll a resultados de catálogo solo con Enter (`#catalogo-resultados`), no al cambiar letras (fix previo).
- Tipos de unidad siguen editables en ERP → **Listado de precios** (crear tipo, presentación y precios).

## Por qué

Rosa pedía ver y elegir precio por paquete/caja/unidad en la ficha, con unidades editables en el ERP (hay muchos tipos). El modelo ya existía; la ficha ocultaba el selector si solo había una presentación y el demo solo tenía Unidad.

## Cómo

- UI: cards seleccionables por presentación; precio de oferta/lista en cada una; mayorista solo si está cargado en esa presentación.
- Carrito: sin cambio de contrato — `addInputFromProduct(..., packagingId)` ya congela precio y etiqueta.
- ERP: sin pantallas nuevas; flujo vigente en `/admin/listado-precios`.

## Archivos

- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx` (scroll solo con hash Enter)
- `RosverSac/server/sql/013_product_pack_prices_seed.sql`
- `docs/logica-y-flujos/04-catalogo-precios-unidades.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Abrir `/producto/...` de RS-5402 (o recargar catálogo tras migrate): aparecen Unidad, Paquete y Caja con precios
- [ ] Elegir Caja → Agregar al carrito → línea con etiqueta Caja y precio de caja
- [ ] En `/admin/listado-precios` se puede crear tipo (ej. “Docena”), presentación y precios
- [ ] En catálogo: tipear en buscador no baja la página; Enter sí baja a resultados
- [ ] _(UI)_ Móvil / tablet / desktop: cards de presentación en 1 o 3 columnas
- [ ] _(UI)_ Sin assets pesados nuevos
