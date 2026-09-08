# Cambio: Bloquear scroll horizontal en Home / layout público

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `html` / `body` / `#root`: `overflow-x: hidden` + `max-width: 100%`.
- `PublicLayout`: `overflow-x-hidden`.
- `BrandCarousel`: `overflow-hidden` en la sección + `w-full` / `min-w-0` (el marquee ya no ensancha la página).
- Home `main` y header: `overflow-x-hidden` / `min-w-0`.

## Por qué

El marquee de marcas (`w-max`) desbordaba el viewport y habilitaba scroll lateral en toda la Home.

## Archivos

- `RosverSac/src/styles/global.css`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/features/catalog/ui/BrandCarousel.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0050-fix-overflow-horizontal-home.md`

## Cómo verificar

- [ ] En `/` no hay scrollbar horizontal ni se puede desplazar a los lados
- [ ] El marquee de marcas sigue animando, recortado dentro de su franja
- [ ] Carruseles de categorías/productos siguen desplazables con flechas
- [ ] Móvil / tablet / desktop OK
