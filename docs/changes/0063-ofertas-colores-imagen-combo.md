# Cambio: Ofertas — colores Rosver + imagen combo

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `OfferCard`: layout con imagen de producto/combo a la izquierda (borde ink + sombra roja, badge “Combo” / −%).
- Colores: badge campaña rojo/blanco, ahorro y precio en `rosver-red` (sin ámbar/verde teal).
- CTA “Añadir” en rojo Rosver; WhatsApp sigue verde marca.
- Ícono de escala volumen también en rojo/ink.

## Por qué

Las cards no se leían como Rosver (amarillo/teal) y faltaba imagen de lote/combo.

## Archivos

- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `docs/changes/0063-ofertas-colores-imagen-combo.md`

## Cómo verificar

- [ ] `/ofertas`: cada card muestra foto + “Combo”
- [ ] Badge/ahorro/precio/CTA en rojo-negro-blanco
- [ ] Móvil: imagen arriba; tablet/desktop: imagen a la izquierda
- [ ] Lazy en imágenes; sin assets nuevos pesados
