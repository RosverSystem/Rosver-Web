# Feature: Carrito

**Slug:** `features/cart/`  
**Estado:** activa (diseño visual alineado a cotizar)

## Propósito

Permitir armar un carrito de productos para pasar a **cotización** o **pedido**.

## Alcance

- Incluido: añadir/quitar/cambiar cantidad, `/carrito`, CTAs a cotizar o pedir.
- Estado compartido: `CartProvider` / `useCart` (seed mock `INITIAL_CART`).
- Buscador en la propia vista (vacío o para agregar más).
- Beneficios 24 h / TC abajo.
- Fuera: pagos, stock real, persistencia servidor (fase lógica).

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `CartProvider` | provider | Montar en `App` |
| `useCart` | hook | `lines`, `itemCount`, `addItem`, `replaceAll`, etc. |
| `CartPage` | página | Vista del carrito (`/carrito`) |
| `AddToCartButton` | UI | CTA usado en `ProductPage` de `catalog` |
| `CartLine` | tipo | `{ productSlug, quantity }` |

## Flujos

`03-vistas-y-flujos.md` → F4. Cotizar (`quotes`) lee/escribe el carrito vía `useCart`.

## Verificación

- [x] Carrito vacío con buscador + CTA catálogo
- [x] Carrito con ítems: foto, qty, quitar, subtotal + TC
- [x] Botones Cotizar y Pedir (camino dual A/B)
- [x] Badge navbar con `itemCount`
- [x] Diseño visual (banner Memphis + beneficios)
- [ ] Persistencia localStorage / API (fase lógica)
