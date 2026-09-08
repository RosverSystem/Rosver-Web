# Cambio: Cotizar con carrito, buscador y layout marketplace

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `QuoteRequestPage`: datos de negocio, tabs catálogo/lista libre, filas con presentación/cantidad, total + TC ref., WhatsApp y “Pasar lista a carrito”.
- Si el carrito tiene ítems se precargan; si no, buscador de catálogo.
- Beneficios (24 h, sin cuenta, asesoría) + CTA carrito **abajo** del formulario.
- `CartProvider` / `useCart` compartido; badge del navbar refleja cantidad; `CartPage` usa el mismo store.

## Por qué

El mock de cotización pide lista editable + pull del carrito; el form genérico no cubría ese flujo.

## Cómo

Estado de carrito en React Context (fase visual, seed `INITIAL_CART`). Cotizar lee/escribe vía API pública de `cart`.

## Archivos

- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/features/cart/model/cart-store.tsx`
- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `RosverSac/src/features/cart/index.ts`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/features/quotes.md`
- `docs/features/cart.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0060-cotizar-carrito-buscador.md`

## Cómo verificar

- [ ] `/cotizar` con carrito mock: lista precargada (taladro + llaves)
- [ ] Vaciar carrito → `/cotizar` muestra buscador vacío; agregar producto desde search
- [ ] WhatsApp abre con mensaje armado; “Pasar lista a carrito” actualiza `/carrito`
- [ ] Badge navbar = suma de cantidades
- [ ] Beneficios 24h/TC visibles debajo de los botones
- [ ] Móvil: tabs y filas apiladas; tablet/desktop usables
- [ ] Sin assets bitmap nuevos
