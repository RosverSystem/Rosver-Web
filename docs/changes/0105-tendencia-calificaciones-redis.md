# Cambio: Tendencia + calificaciones (Postgres + Redis)

**Fecha:** 2026-09-08  
**Tipo:** feature

## Qué cambió

- Doc `docs/logica-y-flujos/06-tendencia-calificaciones.md`.
- Migración `005_trending_ratings.sql`: `trending`, `trending_sort`, tabla `product_reviews`.
- API `GET /api/catalog/trending?category=` + bloque en `/api/catalog`; caché Redis por categoría.
- Admin: marcar tendencia, agregar reseñas (recalcula `rating` / `review_count`).
- UI: estrellas en `ProductCard`; `TrendingProducts` prioriza `trending` y filtra por pill de categoría.
- Versión `0.1.13`.

## Por qué

La sección «Productos en tendencia» y las calificaciones debían vivir en DB (con Redis) igual que Destacados.

## Cómo

`trending` manual + fallback por score `rating * ln(reviews+1)`. Reseñas en `product_reviews` actualizan agregados del producto.

## Archivos

- `docs/logica-y-flujos/06-tendencia-calificaciones.md`
- `RosverSac/server/sql/005_trending_ratings.sql`
- `RosverSac/server/src/lib/catalog-products.ts`, `redis.ts`, `product-ratings.ts`
- `RosverSac/server/src/routes/catalog.ts`, `admin-catalog.ts`
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx`, `ProductCard.tsx`, `ProductRatingStars.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`

## Cómo verificar

- [ ] Migración `005` en boot
- [ ] Admin → tendencia ON → pill de su categoría en home
- [ ] Agregar reseña → estrellas y promedio en card
- [ ] `/api/catalog/trending?category=herramientas` responde productos
- [ ] Redis: `trendingMeta.cache` hit/miss
- [ ] Móvil / tablet / desktop: pills + estrellas legibles
