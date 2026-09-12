# Cambio: Catálogo PDF estilo categorías (sin índice)

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Quitado el índice general del PDF.
- Flujo: **Caratula.pdf** → **portada por categoría** (lista de subcategorías + marcas) → **páginas de productos** en grilla 2×2 (nombre, código, badge empaque, foto).
- Estilo tipo catálogo importador, paleta Rosver (rojo/negro).
- FAB con Motion (entrada / hover).

## Por qué

Referencia visual del usuario: carátulas por rubro y fichas de producto, no tabla de contenidos.

## Archivos

- `RosverSac/src/features/catalog/lib/catalog-pdf/*`
- `RosverSac/src/shared/ui/catalog-pdf-floating-button.tsx`

## Cómo verificar

- [ ] Descargar PDF: carátula general + una portada por categoría
- [ ] Sin página de “Índice”
- [ ] Productos con CODIGO + badge Paquete/UND + imagen
- [ ] Móvil: FAB usable encima de WhatsApp
