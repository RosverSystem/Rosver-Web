# Cambio: Rediseño vista Carrito

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `CartPage`: banner Memphis, lista con thumb/SKU/qty/quitar, subtotal + TC ref.
- Buscador siempre visible: vacío → agregar; con ítems → sumar más.
- CTAs duales (cotizar / continuar pedido) + seguir comprando.
- Beneficios 24 h / cotiza sin cuenta / TC + CTA a cotizar abajo.
- Sin Lucide; iconos `cssvg-icons`.

## Por qué

El carrito seguía como lista mínima; cotizar ya tenía el lenguaje visual y el buscador.

## Cómo

Reutiliza `useCart`; thumb local con `imageUrl` o placeholder (sin importar internos de catalog).

## Archivos

- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `docs/features/cart.md`
- `docs/features/README.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0061-rediseno-carrito.md`

## Cómo verificar

- [ ] `/carrito` con seed: 2 ítems, badge navbar correcto
- [ ] Vaciar todo → empty + buscador; agregar producto desde search
- [ ] Cotizar / Continuar pedido / Seguir comprando
- [ ] Bloque 24h/TC visible abajo
- [ ] Móvil: filas apiladas; tablet/desktop en fila
- [ ] Imágenes lazy; sin bitmap decorativo
