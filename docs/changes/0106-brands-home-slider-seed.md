# Cambio: Slider marcas vinculado a DB + seed

**Fecha:** 2026-09-08  
**Tipo:** feature

## Qué cambió

- Migración `006_brands_home_seed.sql`: columna `show_on_home` + seed de 8 marcas (Bosch, DeWalt, 3M, Ingco, Total, Truper, Stanley, Makita).
- Slider «Marcas que importamos» usa `/api/catalog` → marcas con `visible` + `showOnHome`.
- Admin marcas: checkbox / toggle «Mostrar en inicio».
- Versión `0.1.14`.

## Por qué

El marquee del home debía salir del módulo Marcas (Postgres), no solo de mocks.

## Cómo

Seed idempotente por `sku`. El cliente hidrata marcas desde la API; si no hay filas, fallback a mocks locales.

## Archivos

- `RosverSac/server/sql/006_brands_home_seed.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`, `catalog.ts`
- `RosverSac/src/features/catalog/ui/BrandCarousel.tsx`, `model/brands.ts`, `model/catalog-store.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminBrandsPage.tsx`

## Cómo verificar

- [ ] Tras deploy, `/admin/marcas` lista las 8 marcas
- [ ] Inicio muestra el slider con esos nombres
- [ ] «Quitar del inicio» saca la marca del marquee
- [ ] Crear marca nueva con checkbox inicio → aparece en el slider
- [ ] Móvil / tablet / desktop: marquee usable
