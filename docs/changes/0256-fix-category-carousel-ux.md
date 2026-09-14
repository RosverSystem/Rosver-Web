# Cambio: Fix UX carrusel «Busca por categoría»

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Carrusel ya no recorta cards: se quitó `overflow-x-hidden` del `<main>` home y padding vertical para ring/sombra.
- Flechas fuera de la card (header en tablet/desktop; laterales solo en móvil, sin tapar el contenido).
- Si hay &lt; 3 categorías con `showOnHome`, se completan con el resto de raíces visibles (evita 1 card + vacío enorme).
- Cards: `object-center`, ring con offset, sombra más suave, fondo ink.
- Versión `0.1.58`.

## Por qué

Rosa reportó la sección recortada y con errores UX (flecha encima, hueco vacío, card cortada). En prod solo «ESCOLAR» tenía `showOnHome`.

## Cómo

Misma pauta de flechas que «mayoristas»; fallback de datos en el filtro del carrusel.

## Archivos

- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/CategoryHomeCard.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/package.json`
- `docs/changes/0256-fix-category-carousel-ux.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` → «Busca por categoría» muestra varias cards (no solo una aislada)
- [ ] Cards completas, sin corte de sombra/borde rojo
- [ ] Flechas no tapan la foto (desktop: arriba a la derecha)
- [ ] Móvil: se puede deslizar y ver peeks de la siguiente card
- [ ] Tablet / desktop OK
- [ ] Deploy rosversac.com
