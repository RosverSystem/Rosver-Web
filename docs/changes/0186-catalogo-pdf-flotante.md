# Cambio: Catálogo PDF flotante profesional

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- FAB **Catálogo PDF** (icono Download + “PDF”) flotante encima del WhatsApp.
- Generación automática del catálogo con diseño editorial Rosver:
  1. Carátula `public/CatalagoPDF/Caratula.pdf` (fusionada)
  2. Portada interna + índice de categorías/subcategorías
  3. Productos por categoría → subcategoría (foto, nombre, SKU, código, precio, descripción corta)
- Librerías: `@react-pdf/renderer` (layout profesional) + `pdf-lib` (unir carátula). Carga diferida al clic.

## Por qué

Pedido de catálogo automático con estilo profesional y acceso flotante como WhatsApp.

## Cómo

- Árbol desde `useCatalog()` → `buildCatalogSections`
- Imágenes a data URL por lotes
- `pdf(<CatalogPdfDocument />).toBlob()` → merge con Caratula → descarga `Catalogo-Rosver-YYYY.pdf`

## Archivos

- `RosverSac/src/features/catalog/lib/catalog-pdf/*`
- `RosverSac/src/shared/ui/catalog-pdf-floating-button.tsx`
- `RosverSac/src/app/App.tsx`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/features/catalog.md` (si aplica)

## Cómo verificar

- [ ] En tienda pública: FAB negro encima del verde WhatsApp
- [ ] Clic descarga PDF con carátula + índice + productos por subcategoría
- [ ] Fotos de producto cuando hay `imageUrl`
- [ ] Móvil / tablet / desktop: FAB no tapa contenido crítico
- [ ] Bundle inicial no carga react-pdf hasta el clic
