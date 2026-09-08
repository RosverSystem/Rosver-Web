# 0034 — Carrusel de marcas bajo el hero

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Nuevo `BrandCarousel` centrado y en primer plano (tarjeta con sombra, `z-20`, ligero solape bajo el hero).
- Modelo `BRANDS` / `Brand` listo para logos ERP (`logoUrl` opcional).
- Marquee CSS infinito; se pausa al hover / reduced-motion.
- Montado en `HomePage` entre `HeroBannerGrid` y `TrustBadges`.

## Por qué

Usar el espacio vacío bajo los banners para mostrar marcas importadas, bien centradas y visibles.

## Cómo

- Duplicar lista para loop `-50%` translate.
- Placeholders tipográficos hasta tener PNG/SVG reales.

## Archivos

- `RosverSac/src/features/catalog/ui/BrandCarousel.tsx`
- `RosverSac/src/features/catalog/model/brands.ts`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/styles/global.css`
- `docs/architecture/06-banners-hero-y-assets.md`

## Cómo verificar

- [ ] `/` — debajo del hero aparece la franja “Marcas que importamos”, centrada
- [ ] Logos/nombres se desplazan; al hover se pausan
- [ ] _(UI)_ Móvil / tablet / desktop sin overflow
- [ ] _(UI)_ Reduced-motion: sin animación infinita
