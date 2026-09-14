# Cambio: Hero CTA full-bleed (estilo despachos / PDF)

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Sin paneles CMS: el bloque «Despachos y catálogo oficial» ocupa **todo el ancho** (antes quedaba una franja estrecha ~1/6).
- Tipografía jerárquica (eyebrow Rosver + título + «oficial» en rojo), subtítulo y 2 CTAs (PDF + Ver catálogo).
- Botón PDF en una sola línea (`whitespace-nowrap`), con iconos cssvg.
- Acento: barra roja lateral + glow + trama sutil.
- Con paneles de imagen: se mantiene el strip compacto del multipanel.
- Versión `0.1.60`.

## Por qué

Rosa pidió mejor estilo: se veía recortado, botón partido en 2 líneas y vacío raro.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/package.json`
- `docs/changes/0257-hero-cta-fullbleed-style.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` sin slides CMS: hero oscuro a ancho completo, tipografía clara
- [ ] «Descargar PDF» en una línea; no se parte
- [ ] CTA secundario «Ver catálogo» visible
- [ ] Móvil / tablet / desktop
- [ ] Con slides CMS reales: strip multipanel sigue funcionando
- [ ] Deploy rosversac.com
