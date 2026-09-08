# Cambio: Quitar TrustBadges y TrustBar del Home

**Fecha:** 2026-09-07  
**Tipo:** chore

## Qué cambió

- Home ya no muestra “Por qué comprar en Rosver” ni las cards de stats.
- Eliminados `TrustBadges.tsx` y `TrustBar.tsx`.
- Tras marcas, el Home pasa directo a `CategoryCarousel`.

## Por qué

Pedido explícito de eliminar ese bloque.

## Archivos

- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/TrustBadges.tsx` (eliminado)
- `RosverSac/src/features/catalog/ui/TrustBar.tsx` (eliminado)
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0046-quitar-trust-home.md`

## Cómo verificar

- [ ] `/` no muestra “Por qué comprar en Rosver” ni +10 / 6 / +500 / 24h
- [ ] Tras marcas aparece “Categorías destacadas”
- [ ] Móvil / tablet / desktop OK
