# Cambio: ProductCard estilo marketplace (SKU, mayorista, CTA)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `ProductCard` al estilo referencia: badges Destacado/Oferta/−%, vendor, título, SKU, precio + tachado, línea **Mayorista**, botón **Agregar al carrito**.
- Modelo: `wholesalePrice?`, `featured?` + helper `getWholesalePrice` (si no hay mayorista, ~8% bajo lista).
- CTA usa `useCart` (badge del header sube).
- Colores Rosver (ink/rojo); sin Lucide en la card.

## Por qué

Las cards no mostraban la jerarquía de datos que el negocio necesita (SKU + mayorista + CTA claro).

## Archivos

- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/index.ts`
- `docs/features/catalog.md`
- `docs/changes/0069-product-card-mayorista.md`

## Cómo verificar

- [ ] `/catalogo` y home carousels: card con vendor, SKU, mayorista, botón
- [ ] Oferta muestra badge Oferta + %; Destacado en products con `featured`
- [ ] Agregar al carrito incrementa badge
- [ ] Móvil / tablet / desktop OK
