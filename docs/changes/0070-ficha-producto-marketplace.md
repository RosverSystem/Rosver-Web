# Cambio: Ficha de producto estilo marketplace

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `ProductPage` rediseñada al estilo referencia (Rosver):
  - Hero 2 cols: imagen + badges; marca, título, SKU, stock, precio, caja mayorista.
  - CTAs: Agregar al carrito (`useCart`) + Cotizar WhatsApp (mensaje con SKU).
  - Descripción + tabla de especificaciones (zebra).
  - Productos relacionados (`ProductCard`).
  - Banda CTA cotización B2B.

## Por qué

La ficha era mínima; al hacer click en el producto debía verse el layout completo tipo catálogo B2B.

## Archivos

- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `docs/features/catalog.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0070-ficha-producto-marketplace.md`

## Cómo verificar

- [ ] Abrir un producto desde `/catalogo`
- [ ] Ver mayorista (si hay precio), stock badge, 2 CTAs
- [ ] Specs + relacionados + CTA cotizar
- [ ] Carrito sube al agregar; WhatsApp abre con el producto
- [ ] Móvil: imagen arriba, info abajo; tablet/desktop 2 cols
