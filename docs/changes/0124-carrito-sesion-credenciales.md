# Cambio: Carrito continuo + sesión + credenciales seed

**Fecha:** 2026-09-08  
**Tipo:** fix | feature | docs

## Qué cambió

- Badge del carrito en navbar usa solo unidades de productos que existen en el catálogo (corrige “15” fantasma).
- `CartCatalogSync` sincroniza al cambiar el catálogo (sin saltarse por `refreshing`).
- **Continuar pedido** prefill con sesión; no pide login si ya estás dentro; guarda pedido local en `/cuenta/pedidos`.
- Cotizar prefill con datos de `useAuth`.
- Credenciales seed documentadas en `.env.example` y change.

## Por qué

Usuario logueado como Andrés veía badge 15 vs 1 ítem, y el flujo de pedido no quedaba ligado a la cuenta; necesitaba las cuentas de prueba.

## Cómo

- `visibleCartItemCount(lines, products)` compartido navbar + helper.
- Pedidos locales `rosver.local-orders.v1` mergeados con mocks en cuenta.
- Prefill modal/cotizar desde perfil auth.

## Archivos

- `RosverSac/src/features/cart/model/cart-visible.ts`
- `RosverSac/src/features/cart/ui/CartCatalogSync.tsx`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/cart/index.ts`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/features/account/model/local-orders.ts`
- `RosverSac/src/features/account/ui/AccountOrdersPage.tsx`
- `RosverSac/src/features/account/ui/AccountOrderDetailPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/.env.example`
- `docs/logica-y-flujos/07-carrito.md`
- `docs/pendientes/PENDIENTES.md`
- `docs/changes/0124-carrito-sesion-credenciales.md`

## Credenciales seed (defaults)

| Rol | Email | Password |
| --- | --- | --- |
| Admin | `admin@multiserviciosmta.site` | `RosverAdmin!2026` |
| Cliente (Andrés) | `acosta.wp076@gmail.com` | `RosverCliente!2026` |

Override: `SEED_*` en Railway / `.env`.

## Cómo verificar

- [ ] Navbar badge = suma de cantidades de líneas resolubles (no fantasmas)
- [ ] Vaciar localStorage `rosver.cart.v1` y recargar limpia badge viejo
- [ ] Logueado → Continuar pedido abre modal (no `/login`); campos prellenados
- [ ] PDF/WA → aparece pedido `LOC-…` en `/cuenta/pedidos`
- [ ] Login con credenciales seed arriba
- [ ] _(UI)_ Móvil / tablet / desktop OK en modal y carrito
