# Cambio: Fix UX carrusel «Busca por categoría»

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Carrusel ya no recorta cards: se quitó `overflow-x-hidden` del `<main>` home y padding vertical/horizontal para ring/sombra.
- Flechas fuera de la card (header en tablet/desktop; laterales solo en móvil).
- Si hay &lt; 3 categorías con `showOnHome`, se completan con el resto de raíces visibles.
- Con 1–2 cards: centradas, más grandes, sin flechas engañosas; título centrado.
- Cards: `object-center`, ring con offset, sombra más suave, fondo ink.
- Versión `0.1.59`.

## Por qué

Rosa reportó la sección recortada y con errores UX. En prod el catálogo live solo tenía **ESCOLAR** como raíz (`showOnHome`), y las flechas + overflow dejaban la card cortada y el hueco vacío.

## Cómo

Misma pauta de flechas que «mayoristas»; fallback de datos; layout adaptativo según cantidad.

## Archivos

- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/CategoryHomeCard.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/package.json`
- `docs/changes/0256-fix-category-carousel-ux.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` → card ESCOLAR centrada, completa, sin flecha encima
- [ ] Ring rojo y sombra visibles sin corte
- [ ] Si hay ≥3 raíces: carrusel horizontal con flechas en el header (desktop)
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
