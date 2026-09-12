# Cambio: Ofertas = combos (ERP → tienda → pedidos/cotizaciones)

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Migración `035_offer_combos.sql`: tablas `offer_combos` + `offer_combo_items`; snapshot combo documentado en JSONB de pedidos/cotizaciones.
- API admin CRUD `/api/admin/offer-combos` y público `offerCombos` en `/api/catalog` (+ `/api/catalog/offers`).
- `/admin/ofertas` reescrito: solo combos en `AdminModal` (2x1, pack fijo, pack cantidad).
- `/ofertas` muestra combos; CTA agrega **una línea combo** al carrito.
- Pedidos y cotizaciones aceptan `lineKind=combo` + `comboId` + `comboSnapshot`; admin detalle muestra badge Combo e ítems del pack.

## Por qué

El módulo Ofertas debía crear promociones tipo pack/2x1 (no productos), venderlas en tienda como un ítem y persistirlas en pedidos/cotizaciones sin perder el detalle.

## Cómo

- Precio de línea = precio del combo (no suma suelta de SKUs).
- Snapshot JSONB en el ítem para historial inmutable.
- Precios markdown por SKU siguen en ficha producto (fuera de `/admin/ofertas`).

## Archivos

- `RosverSac/server/sql/035_offer_combos.sql`
- `RosverSac/server/src/lib/offer-combos.ts`
- `RosverSac/server/src/routes/admin-offer-combos.ts`
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/features/catalog/model/catalog-store.tsx`
- `RosverSac/src/features/catalog/model/offer-combo.ts`
- `RosverSac/src/features/cart/model/*`
- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/features/admin-orders/ui/AdminOrderWorkspacePage.tsx`
- `RosverSac/src/features/quotes/ui/AdminQuoteWorkspacePage.tsx`
- `docs/logica-y-flujos/07-ofertas-erp-tienda.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Crear combo 2x1 y pack de 3 productos a precio fijo en `/admin/ofertas`
- [ ] Verlos en `/ofertas`, agregar al carrito; total = precio combo
- [ ] Continuar pedido y cotización: líneas con snapshot combo
- [ ] Admin pedido/cotización muestra badge Combo + detalle de ítems
- [ ] Modal admin usable en **móvil** (&lt;768px)
- [ ] Modal admin usable en **tablet** (768–1023px)
- [ ] Modal admin usable en **desktop** (≥1024px)
