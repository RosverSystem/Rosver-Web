# Cambio: Hero alineado al ejemplo Katrina (4 paneles foto)

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Hero vuelve a parecerse al ejemplo: CTA oscuro simple + **4 paneles con foto**, título y pill partido **rojo | blanco**.
- Copy de paneles del ejemplo (catálogo digital, Shalom, Marvisur, courier).
- Demo con fotos Unsplash temporales (800×1200) hasta assets R2 (P134).
- CTA: tipografía blanca 3 líneas + solo «Descargar PDF ›» (sin eyebrow ni 2º botón).
- Trust bar e indicador de scroll estilo referencia (acento rosver-red).
- Versión `0.1.63`.

## Por qué

Rosa: «no se parece nada al ejemplo».

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/src/features/catalog/model/home-hero-slides.ts`
- `RosverSac/package.json`
- `docs/changes/0260-hero-match-katrina-example.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` muestra CTA + 4 paneles con foto, título y pill rojo/blanco
- [ ] Desktop (≥1100): las 5 columnas a la vez
- [ ] PDF descarga OK
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
