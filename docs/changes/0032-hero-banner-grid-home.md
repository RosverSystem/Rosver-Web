# 0032 — Hero Home tipo grilla de banners (referencia grocery)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Nuevo `HeroBannerGrid`: layout 1 banner grande (izq.) + 1 mediano (der. arriba) + 2 tiles (der. abajo), como la referencia grocery.
- Modelo `HOME_BANNERS` / `HomeBanner` listo para admin-content/ERP (`slot`, `imageUrl`, `tone`, CTAs HTML).
- `HomePage` usa el grid; se eliminó `HeroCarousel.tsx`.
- Docs `06-banners-hero-y-assets.md` y `03-vistas-y-flujos.md` actualizados.
- Paleta Rosver (rojo/negro/soft/warm), no pasteles de la referencia.

## Por qué

El inicio debía abrir con un bloque de banners promocionales al estilo marketplace de la imagen enviada.

## Cómo

- CSS grid asimétrico desde `lg`; apilado en móvil.
- Imágenes mock Unsplash en el panel; texto y botones reales (accesibles).
- Hover: leve scale de la imagen del producto.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroBannerGrid.tsx`
- `RosverSac/src/features/catalog/model/home-banners.ts`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx` (eliminado)
- `docs/architecture/06-banners-hero-y-assets.md`
- `docs/architecture/03-vistas-y-flujos.md`

## Cómo verificar

- [ ] `/` muestra grilla de 4 banners con CTAs clicables
- [ ] Desktop: grande a la izquierda; 3 a la derecha
- [ ] Móvil: banners apilados, legibles, sin overflow
- [ ] Links van a `/catalogo`, `/cotizar`, categorías
- [ ] _(UI)_ Tablet intermedio aceptable
- [ ] _(UI)_ Imágenes lazy en tiles; primary eager
