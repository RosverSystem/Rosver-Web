# Cambio: Ofertas desde Postgres (seed 3 + ERP alta)

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.18

## Qué cambió

- Migración `008_offers_seed.sql`: 3 ofertas ejemplo (multímetro, lámpara, taladro).
- `/ofertas` consume solo `offers[]` de DB (sin mocks).
- `GET /api/catalog/offers` + `offers` en `/api/catalog`.
- ERP `/admin/ofertas`: publicar oferta (producto nuevo o existente) y quitar oferta.
- Doc `docs/logica-y-flujos/07-ofertas-erp-tienda.md`.

## Por qué

La página de ofertas seguía con datos mock; se pide lógica ERP → web con datos reales y poder seguir agregando.

## Cómo

Precios `list` + `offer` por empaque; el mapper de catálogo prioriza offer como precio de venta.

## Archivos

- `RosverSac/server/sql/008_offers_seed.sql`
- `RosverSac/server/src/routes/catalog.ts`, `admin-catalog.ts`
- `RosverSac/src/features/catalog/model/catalog-store.tsx`, `offers.ts`, `ui/OffersPage.tsx`, `OfferCard.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `docs/logica-y-flujos/07-ofertas-erp-tienda.md`, `docs/pendientes/`

## Cómo verificar

- [ ] Deploy aplica `008` (boot migrate)
- [ ] `/ofertas` muestra 3 cards (RS-4201, RS-5402, RS-1042)
- [ ] `/admin/ofertas` publicar otra oferta → aparece en tienda
- [ ] Quitar oferta la saca de `/ofertas`
- [ ] Sin mocks de catálogo en ofertas cuando hay live products
- [ ] Móvil / tablet / desktop
