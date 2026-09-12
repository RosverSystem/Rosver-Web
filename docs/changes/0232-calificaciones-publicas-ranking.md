# Cambio: Calificaciones públicas + ranking

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Migración `037_product_ratings_public.sql`: `guest_key` + índices únicos (1 voto por usuario o invitado por producto).
- API pública: `GET/POST /api/catalog/products/:slug/rating`, `GET /api/catalog/ranking`.
- Ficha producto: estrellas clicables (con o sin sesión); toasts; bloqueo tras 1 voto.
- Página `/ranking` (mejores calificados) + enlace en nav, footer y tendencia home.
- Doc flujo `06-tendencia-calificaciones.md` actualizado.

## Por qué

Las estrellas solo mostraban promedio; se pidió calificar (invitado o registrado, 1 vez) y un módulo ranking.

## Cómo

- Invitado: `localStorage` `rosver_rating_guest_key`.
- Logueado: `user_id` en sesión cookie; se ignora guest al insertar.
- Score ranking: `rating * ln(review_count + 1)`.

## Archivos

- `RosverSac/server/sql/037_product_ratings_public.sql`
- `RosverSac/server/src/lib/product-ratings.ts`
- `RosverSac/server/src/lib/catalog-products.ts` (`queryRankingProducts`)
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/src/features/catalog/ui/ProductRatingStars.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/ui/RankingPage.tsx`
- `RosverSac/src/features/catalog/lib/guest-rating-key.ts`
- `RosverSac/src/features/catalog/model/api-ratings.ts`
- `RosverSac/src/app/App.tsx`, `PublicNavbar.tsx`, `Footer.tsx`
- `docs/logica-y-flujos/06-tendencia-calificaciones.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Migración 037 aplicada (`npm run db:migrate`)
- [ ] En `/producto/:slug`, tocar 1–5 estrellas sin login → toast éxito; segundo intento → «solo una vez»
- [ ] Con sesión, mismo producto no permite otro voto (409)
- [ ] `/ranking` lista productos con `review_count > 0` ordenados por score
- [ ] Nav «Ranking» y footer enlazan a `/ranking`
- [ ] Móvil / tablet / desktop: estrellas táctiles y grid ranking legibles
- [ ] Percepción de carga aceptable
