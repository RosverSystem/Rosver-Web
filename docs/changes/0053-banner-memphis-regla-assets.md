# Cambio: Banner catálogo Memphis Rosver + regla assets

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `CatalogBanner` rediseñado estilo Memphis bold (rayas, sticker, sombra dura, zigzag SVG, Motiones) en **rojo / ink / blanco** — sin bitmap.
- CTA “Explorar ahora” ancla a `#catalogo-resultados`.
- Nueva regla **`08-assets-optimizacion`** (Cursor `.mdc` + Claude `.md`) y mención en `AGENTS.md` / `CLAUDE.md`.

## Por qué

Se pidió un banner tipo “sale Memphis” con colores Rosver, diseño profesional y regla permanente de optimización de logos/imágenes.

## Cómo

Patrones con CSS (`repeating-linear-gradient`, dots) + SVG inline + Motion acotado (`prefers-reduced-motion`). Cero fotos en el banner → LCP liviano.

## Archivos

- `RosverSac/src/features/catalog/ui/CatalogBanner.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `.cursor/rules/08-assets-optimizacion.mdc`
- `.claude/rules/08-assets-optimizacion.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/changes/0053-banner-memphis-regla-assets.md`

## Cómo verificar

- [ ] `/catalogo`: banner bold con rayas rojas/negras, título en sticker, sin imagen pesada
- [ ] Animaciones suaves; con reduced-motion no flotan
- [ ] “Explorar ahora” baja a resultados
- [ ] Móvil / tablet / desktop: rayas laterales no rompen layout
- [ ] Carga rápida (banner = CSS/SVG)
