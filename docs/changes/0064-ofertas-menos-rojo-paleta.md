# Cambio: Ofertas — menos rojo, más paleta

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `OfferCard`: ink / soft / muted / line como base; rojo solo en hover (título / CTA).
- Badge campaña en `rosver-soft`; Combo/descuento en blanco/ink; precio e ahorro en ink.
- CTA “Añadir” ink → hover rojo.
- Sección volumen: ícono y % sin relleno rojo.

## Por qué

Demasiado rojo en cada card; la paleta Rosver también incluye soft, ink, muted y line.

## Archivos

- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `docs/changes/0064-ofertas-menos-rojo-paleta.md`

## Cómo verificar

- [ ] `/ofertas`: cards se leen en negro/gris/blanco; rojo al hover del botón
- [ ] Banner superior sigue rojo (ok, es el hero de la sección)
