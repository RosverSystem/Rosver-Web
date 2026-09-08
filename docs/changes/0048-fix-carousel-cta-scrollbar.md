# Cambio: Fix CTAs categorías + ocultar scroll de carruseles

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Quitado `color: inherit` global en `a` (tapaba `text-white` en botones negros → “Explorar” invisible).
- CTAs de categoría unificados: todos rojo Rosver + texto/ícono blanco.
- Clase `.hide-scrollbar` en CSS global; aplicada a `CategoryCarousel` y `ProductCarousel`.
- Imagen de card en recorte redondeado (`object-cover`) más estable.

## Por qué

En las cards con botón negro el texto no se veía; la barra horizontal del carrusel se notaba por el scrollbar global.

## Archivos

- `RosverSac/src/styles/global.css`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/ProductCarousel.tsx`
- `docs/changes/0048-fix-carousel-cta-scrollbar.md`

## Cómo verificar

- [ ] Todas las cards muestran botón rojo “Explorar →” legible
- [ ] No se ve barra de scroll bajo el carrusel de categorías (solo flechas)
- [ ] Mismo hide-scrollbar en destacados/tendencia
- [ ] Móvil / tablet / desktop OK
