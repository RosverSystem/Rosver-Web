# Cambio: Campaña — 2ª fila con 2 imágenes dobles

**Fecha:** 2026-09-14  
**Tipo:** fix

## Qué cambió

- «Lo último de campaña»: siempre **fila 1 = 4 cards** + **fila 2 = 2 cards** (`col-span-2` en desktop).
- Las de abajo usan aspect más apaisado (ocupan el ancho de 2 columnas).
- Versión `0.1.64`.

## Por qué

Rosa pidió una 2ª fila con solo 2 imágenes a tamaño doble.

## Archivos

- `RosverSac/src/features/catalog/ui/CampaignLatestSection.tsx`
- `RosverSac/package.json`
- `docs/changes/0261-campaign-second-row-wide.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` → campaña: 4 arriba + 2 abajo (cada una ~media fila en desktop)
- [ ] Móvil: 2 columnas (fila 2 también 2 cards apaisadas)
- [ ] Tablet / desktop
- [ ] Deploy rosversac.com
