# Cambio: Home completo + marcas + cifras de confianza

**Fecha:** 2026-09-13  
**Tipo:** feature

## Qué cambió

- Home vuelve a montar: categorías lifestyle, mayoristas, lo último de campaña.
- **Marcas** (`BrandCarousel`) bajo el hero.
- Nueva **TrustStatsSection**: +3 años · +30 mil clientes · +20 mil envíos (grilla desktop / slider móvil).
- Versión `0.1.55`.

## Por qué

Rosa pidió esas secciones de referencia más marcas y un bloque de cifras de mercado.

## Archivos

- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/TrustStatsSection.tsx` (nuevo)
- `RosverSac/package.json`
- `docs/changes/0253-home-sections-brands-stats.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/`: hero → marcas → categorías → mayoristas → campaña → cifras
- [ ] Stats: 3 cards en desktop; carrusel en móvil
- [ ] Marcas: marquee si hay brands en catálogo
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
