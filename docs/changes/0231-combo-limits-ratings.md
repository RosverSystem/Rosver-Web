# Cambio: Límite por usuario en combos + estrellas en productos/combo

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Migración `036_offer_combo_max_per_user.sql`: columna `max_per_user` en `offer_combos`.
- Admin Ofertas: campo «Máximo por usuario»; listado muestra límite y ★ de cada producto.
- Tienda: carrito y pedido respetan el tope (también pedidos previos si hay sesión).
- Combos en `/ofertas` muestran ranking promedio + estrellas por cada producto del pack.
- Ficha `/producto/:slug` muestra calificación con estrellas (antes solo en cards).
- Listado `/ofertas` ordena combos por rating descendente.

## Por qué

Rosa pidió límites de compra por usuario en combos y calificación con estrellas / ranking en cada producto del combo (y en productos existentes).

## Cómo

- `max_per_user` NULL = sin límite; enforcement en `cart-store` + `POST /api/orders` con `countUserComboPurchases`.
- Ratings de ítems del combo vienen de `products.rating` / `review_count` (ya existentes).

## Archivos

- `RosverSac/server/sql/036_offer_combo_max_per_user.sql`
- `RosverSac/server/src/lib/offer-combos.ts`
- `RosverSac/server/src/routes/admin-offer-combos.ts`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/cart/model/*`
- `docs/logica-y-flujos/07-ofertas-erp-tienda.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] En `/admin/ofertas` poner máx. 2 por usuario; en `/ofertas` no dejar agregar el 3.º
- [ ] Pedido con sesión: si ya compró 2, API rechaza el 3.º
- [ ] Cada producto del combo muestra ★ en la card de oferta
- [ ] Ficha producto muestra estrellas bajo el título
- [ ] Modal admin usable en móvil / tablet / desktop
