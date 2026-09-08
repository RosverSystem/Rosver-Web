# Cambio: Quitar escala de volumen en Ofertas

**Fecha:** 2026-09-07  
**Tipo:** chore

## Qué cambió

- Eliminada la sección “Escala de precios por volumen…” de `OffersPage`.
- Eliminado `VOLUME_TIERS` de `offers.ts`.

## Por qué

Pedido explícito: no mostrar ese bloque.

## Archivos

- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `RosverSac/src/features/catalog/model/offers.ts`
- `docs/features/catalog.md`
- `docs/changes/0065-quitar-escala-volumen-ofertas.md`

## Cómo verificar

- [ ] `/ofertas` termina en la grilla/paginación; sin tabla de volumen
