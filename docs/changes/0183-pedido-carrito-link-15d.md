# Cambio: Pedido carrito ≠ cotización + link 15d + WA corto

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Quitados los textos explicativos del modal Continuar pedido (sesión “no hace falta…”, banners verdes/grises, aviso PDF/WhatsApp).
- Quitado el campo **Ciudad o agencia** del modal de pedido (eso queda en `/cotizar`).
- Pedido del carrito ahora persiste en `order_requests` (migración `023`), genera PDF y link público `/p/{nombre}-{codigo}` válido **15 días** (distinto de cotización `/c/…`).
- WhatsApp abre con mensaje corto: `número` + salto de línea + `link` (pedido y cotización).
- Admin: listado real `/admin/pedidos` + nav; API `GET /api/admin/orders`.

## Por qué

Pedido y cotización son flujos distintos; el usuario pidió quitar copy de ayuda, no pedir ubicación en el carrito, guardar pedido en BD con link temporal y acortar el mensaje de WhatsApp.

## Cómo

- Tabla `order_requests` + rutas Hono espejo de quotes (`POST /api/orders`, `PUT …/pdf`, `GET …/public/:slug`).
- `ContinueOrderModal` guarda pedido → PDF → modal compartido `QuoteShareModal` con `kind="order"`.
- `PublicOrderPage` en `/p/:slug`.

## Archivos

- `RosverSac/server/sql/023_order_requests.sql`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/server/src/index.ts`
- `RosverSac/server/src/lib/quote-slug.ts`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/cart/ui/PublicOrderPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteShareModal.tsx`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `docs/features/cart.md`, `quotes.md`, `admin-orders.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/carrito` → Continuar pedido: sin banners de ayuda ni campo ciudad/agencia
- [ ] Generar PDF: crea pedido `PD-…`, abre modal con PDF y link `/p/…`
- [ ] WhatsApp: solo código + URL
- [ ] Abrir link público antes de 15 días muestra pedido + PDF
- [ ] `/cotizar` sigue usando `/c/…` y mensaje WA corto
- [ ] `/admin/pedidos` lista pedidos de DB
- [ ] Móvil / tablet / desktop: modal pedido y share usables
- [ ] _(Si UI)_ Percepción de carga aceptable
