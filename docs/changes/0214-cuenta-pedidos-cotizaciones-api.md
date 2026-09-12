# Cambio: Cuenta — pedidos y cotizaciones reales

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- API: `GET /api/orders/mine` y `/mine/:code`; `GET /api/quotes/mine` y `/mine/:code` (sesión, filtrado por `user_id`).
- `/cuenta/pedidos`, detalle, overview y `/cuenta/cotizaciones` cargan datos vivos (sin mocks Demo).
- Carrito logueado guarda el código real `PD-…` (no solo `LOC-…`).

## Por qué

El tracker de cuenta era mock; al crear pedido/cotización con sesión ya se guardaba `user_id` pero no había listado.

## Cómo

Mapeo a la UI existente (`Order` / `Quote` + `StatusStepper`). Evidencias sensibles (capturas de pago) no se exponen al cliente; sí tracking / notas.

## Archivos

- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/src/features/account/model/api-orders.ts`
- `RosverSac/src/features/account/model/local-orders.ts`
- `RosverSac/src/features/account/ui/AccountOrdersPage.tsx`
- `RosverSac/src/features/account/ui/AccountOrderDetailPage.tsx`
- `RosverSac/src/features/account/ui/AccountOverviewPage.tsx`
- `RosverSac/src/features/quotes/model/api-quotes.ts`
- `RosverSac/src/features/quotes/ui/ClientQuotesPage.tsx`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `docs/changes/0214-cuenta-pedidos-cotizaciones-api.md`

## Cómo verificar

- [ ] Login → crear pedido desde carrito → aparece en `/cuenta/pedidos` con código PD-… y stepper
- [ ] Admin avanza fase → al refrescar cuenta se ve el nuevo estado / tracking
- [ ] Crear cotización logueado → aparece en `/cuenta/cotizaciones`
- [ ] Sin sesión: cotizaciones vacías; pedidos pueden usar local si aplica
- [ ] Detalle `/cuenta/pedidos/:code` carga el pedido propio (404 si no es tuyo)
