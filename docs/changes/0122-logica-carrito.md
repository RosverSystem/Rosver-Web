# Cambio: Lógica de carrito (persistencia + sync catálogo)

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.30

## Qué cambió

- Carrito inicia vacío (sin seed mock) y persiste en `localStorage` (`rosver.cart.v1`).
- `syncWithCatalog` + `CartCatalogSync`: quita líneas de productos que ya no existen (arregla banner “14 unidades” con lista vacía).
- `addInputFromProduct`: al agregar desde card/ficha/ofertas/buscador incluye empaque default y precio.
- Cantidad &lt; 1 elimina la línea; botón Vaciar carrito.
- Docs: `07-carrito.md` + ficha `cart.md`.

## Por qué

El seed `INITIAL_CART` sumaba unidades en el badge/banner aunque el catálogo vivo no resolvía esos slugs → UI vacía inconsistente.

## Cómo

Estado en `CartProvider`; bridge bajo layout público; helpers de línea compartidos.

## Archivos

- `RosverSac/src/features/cart/**`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/app/App.tsx`
- `docs/logica-y-flujos/07-carrito.md`
- `docs/features/cart.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/carrito` vacío sin texto “N unidades” si no hay ítems
- [ ] Agregar desde catálogo → badge navbar + lista con precio/presentación
- [ ] F5 mantiene el carrito
- [ ] − hasta 0 quita línea; Vaciar limpia
- [ ] Cotizar recibe ítems del carrito
- [ ] Móvil / tablet / desktop OK
- [ ] Deploy Railway v0.1.30
