# 0033 — Hero banners: imagen contenida (object-cover)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Las fotos del `HeroBannerGrid` ya no flotan con `object-contain` (recuadros blancos que “sobresalen”).
- Pasan a `absolute inset-0 object-cover` dentro del card con `overflow-hidden`.
- Overlay degradado por tono para legibilidad del texto.

## Por qué

En la preview las imágenes del taladro/productos se veían como bloques blancos saliéndose del diseño.

## Cómo

Full-bleed cover + gradient; hover solo hace scale dentro del clip del card.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroBannerGrid.tsx`

## Cómo verificar

- [ ] `/` — ninguna foto se sale del borde redondeado del banner
- [ ] Texto y CTA siguen legibles sobre la imagen
- [ ] _(UI)_ Móvil / tablet / desktop sin overflow horizontal
