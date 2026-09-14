# Cambio: Hero multipanel estilo referencia + specs diseñador

**Fecha:** 2026-09-13  
**Tipo:** feature

## Qué cambió

- Home: el hero rojo “ola” pasa a **carrusel multipanel** (panel CTA oscuro + paneles verticales con título y pill partido rojo/gris).
- Paleta: rosa de la referencia → `rosver-red` / `rosver-ink` / `rosver-soft`.
- CTA «Descargar PDF» genera el catálogo vía `/api/catalog/pdf`.
- Barra negra inferior con 3 mensajes de valor.
- Specs de imagen para diseñador en `HERO_PANEL_DESIGNER_SPECS` + este change.
- Versión `0.1.50`.

## Por qué

Rosa pidió el modelo tipo Katrina Imports con paleta Rosver y medidas claras para producción de assets.

## Cómo

- Strip con N paneles visibles (1 / 2 / 4 / 6 según breakpoint), flechas y paginación.
- Placeholders Unsplash 800×1200 hasta assets finales.
- CMS `home_hero` sigue mapeando a paneles (`panelsFromCmsSlides`).

## Medidas para el diseñador

| Asset | Tamaño | Ratio | Notas |
| --- | --- | --- | --- |
| **Cada panel** (imagen) | **800 × 1200 px** | 2:3 vertical | Exportar WebP ≤ ~180 KB |
| Zona segura sujeto | **75% superior** | — | El 25% inferior lleva título + pill |
| Master composición (opcional) | **1920 × 720 px** | ~8:3 | Solo referencia de layout desktop |
| Cantidad | **5 paneles** + 1 CTA (sin foto) | — | CTA es tipografía/CSS, no imagen |

Colores del pill: izquierda `#E30613` (texto blanco), derecha `#F3F4F6` (texto `#0D0D0D`).

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/src/features/catalog/model/home-hero-slides.ts`
- `RosverSac/package.json`
- `docs/changes/0248-hero-multipanel-rosver.md`
- `docs/pendientes/PENDIENTES.md`
- `docs/architecture/03-vistas-y-flujos.md` (nota hero)

## Cómo verificar

- [ ] `/` muestra strip multipanel (CTA + imágenes) con pills rojo/gris
- [ ] Flechas y líneas de paginación en móvil / tablet / desktop
- [ ] «Descargar PDF» descarga o muestra toast de error claro
- [ ] Barra negra inferior visible
- [ ] Altura corta (laptop): hero no rompe el layout
- [ ] Deploy: URL pública refleja el nuevo hero
