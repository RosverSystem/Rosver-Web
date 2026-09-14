# Cambio: Hero con 4 paneles de imagen (más ancho)

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Placeholders / slots de foto del hero: **5 → 4**.
- Breakpoint desktop: visibles **5** (1 CTA + 4 paneles) para que ocupen mejor el ancho.
- Specs en `06-banners-hero-y-assets.md` actualizadas.
- Versión `0.1.62`.

## Por qué

Rosa pidió solo 4 paneles para que cada uno tenga más espacio.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/package.json`
- `docs/architecture/06-banners-hero-y-assets.md`
- `docs/changes/0259-hero-four-image-panels.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` → CTA + 4 placeholders «Panel 1…4»
- [ ] En desktop ancho (≥1280) se ven los 5 columnas a la vez (CTA + 4)
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
