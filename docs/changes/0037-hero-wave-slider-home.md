# Cambio: Hero Home full-bleed con ola (estilo grocery)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Reemplazó `HeroBannerGrid` (grilla de 4 tiles) por `HeroWaveSlider`: fondo rojo full-bleed, copy a la izquierda, producto a la derecha sin caja, ola blanca inferior.
- Nuevo modelo `HOME_HERO_SLIDES` / `HomeHeroSlide` listo para admin-content/ERP.
- Eliminados `HeroBannerGrid.tsx` y `home-banners.ts`.
- `HomePage` monta `HeroWaveSlider` encima de `BrandCarousel`.

## Por qué

La grilla tipo marketplace no coincidía con la referencia pedida (hero sólido + producto integrado + transición ondulada al siguiente bloque).

## Cómo

- Sección `bg-rosver-red` + grid 1→2 columnas; imagen con `object-contain` y `z` por encima de la ola SVG.
- Autoplay 6.5s y dots; sin Motion/GSAP en el hero (animación CSS `fade-in` acotada).
- Paleta Rosver (rojo/blanco), no el verde de la referencia grocery.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx` (nuevo)
- `RosverSac/src/features/catalog/model/home-hero-slides.ts` (nuevo)
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/HeroBannerGrid.tsx` (eliminado)
- `RosverSac/src/features/catalog/model/home-banners.ts` (eliminado)
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/architecture/06-banners-hero-y-assets.md`
- `docs/changes/0037-hero-wave-slider-home.md`

## Cómo verificar

- [ ] Home (`/`) muestra hero rojo full-bleed (no grilla de 4 cuadros)
- [ ] Producto a la derecha sin borde/caja; ola blanca abajo antes de marcas
- [ ] CTA lleva a `/catalogo` o `/cotizar` según slide
- [ ] Dots cambian slide; con reduced-motion no hay autoplay
- [ ] Se ve y usa bien en **móvil** (&lt;768px)
- [ ] Se ve y usa bien en **tablet** (768–1023px)
- [ ] Se ve y usa bien en **desktop** (≥1024px)
- [ ] Percepción de carga aceptable; imagen hero eager, sin assets extra pesados
