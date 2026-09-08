# Cambio: Catálogo grilla 3×6 (18 por página)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `PAGE_SIZE` del catálogo: **18** (3 columnas × 6 filas).
- `ProductGrid`: 3 columnas desde `sm`.
- Mocks ampliados a **18 productos** (imágenes con `w=640`); URL rota del kit de destornilladores corregida.

## Archivos

- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `RosverSac/src/features/catalog/ui/ProductGrid.tsx`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `docs/changes/0055-catalogo-grilla-3x6.md`

## Cómo verificar

- [ ] `/catalogo` muestra hasta 18 productos en 3 columnas
- [ ] Contador tipo “Mostrando 1-18 de 18”
- [ ] Móvil: 2 columnas; tablet/desktop: 3
