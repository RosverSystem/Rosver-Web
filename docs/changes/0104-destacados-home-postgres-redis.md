# Cambio: Destacados home — lógica 100% Postgres + Redis

**Fecha:** 2026-09-08  
**Tipo:** feature

## Qué cambió

- Doc de lógica completa: `docs/logica-y-flujos/05-destacados-home-redis.md`.
- Migración `004_featured_home.sql`: `featured_sort` + índice parcial.
- Caché Redis (`ioredis`): clave `rosver:catalog:featured:v1`, TTL 90s; degradación a Postgres si no hay Redis.
- Servicio **Redis** en Railway + `REDIS_URL` en `Rosver-Web`.
- APIs: `GET /api/catalog/featured`, `featured` en `GET /api/catalog`, `PATCH/DELETE` productos (destacado / soft-delete) con invalidación de caché.
- Admin productos: marcar Destacado + orden para el inicio.
- Home: carrusel usa `featured` + `featuredSort` (no los primeros 8 al azar).
- Versión `0.1.12`.

## Por qué

La sección «Destacados para ti» debía salir de la base de datos con reglas claras (precio, oferta, cotizar, mayorista) y caché Redis en el home.

## Cómo

Postgres = fuente de verdad. Redis = lectura rápida del listado destacado. Admin marca productos; tienda hidrata vía `/api/catalog`.

## Archivos

- `docs/logica-y-flujos/05-destacados-home-redis.md`
- `RosverSac/server/sql/004_featured_home.sql`
- `RosverSac/server/src/lib/redis.ts`, `catalog-products.ts`
- `RosverSac/server/src/routes/catalog.ts`, `admin-catalog.ts`, `config.ts`, `index.ts`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`, `model/mocks.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `docs/architecture/04-stack-y-librerias.md`, `08-despliegue-y-almacenamiento.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Redis Online en Railway; `/api/health` muestra `redis.configured: true`
- [ ] Boot aplica `004`
- [ ] Admin → producto → Destacado → aparece en inicio
- [ ] Orden del carrusel respeta `featured_sort`
- [ ] Quitar destacado invalida caché (sale del home)
- [ ] Sin Redis la API sigue respondiendo desde Postgres
- [ ] Móvil / tablet / desktop: carrusel Destacados usable
