# 0036 — Carrusel marcas sin cuadro (franja)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `BrandCarousel` sin tarjeta blanca ni cajas por marca.
- Franja full-width con líneas arriba/abajo, label fijo a la izquierda + marquee.
- Flecha con `cssvg-icons` (`ArrowRight` + `hoverToAnimate`).

## Por qué

El usuario pidió eliminar el “cuadro” y acercarse al ejemplo de franja de tecnologías/marcas.

## Archivos

- `RosverSac/src/features/catalog/ui/BrandCarousel.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`

## Cómo verificar

- [ ] `/` — marcas en franja sin card ni bordes por logo
- [ ] Label “Marcas que importamos” a la izquierda
- [ ] _(UI)_ Móvil / tablet / desktop sin overflow
