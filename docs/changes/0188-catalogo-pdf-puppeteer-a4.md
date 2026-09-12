# Cambio: Catálogo PDF con Puppeteer (A4 completo)

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Catálogo PDF generado en **servidor** con **HTML/CSS + Puppeteer** (Chromium), no react-pdf en el cliente.
- Portada de categoría ocupa **A4 completo** (hero flex + bloque marcas + pie).
- `GET /api/catalog/pdf` → PDF con `Caratula.pdf` + secciones.
- FAB solo descarga ese endpoint (Motion).

## Por qué

La portada de categoría salía incompleta (hueco blanco) con altura fija en react-pdf. HTML + print CSS de Chromium da diseño A4 real.

## Archivos

- `RosverSac/server/src/lib/catalog-pdf-html.ts`
- `RosverSac/server/src/lib/catalog-pdf-render.ts`
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/src/shared/ui/catalog-pdf-floating-button.tsx`
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [ ] Clic FAB PDF descarga archivo
- [ ] Tras carátula: portada categoría llena la hoja A4
- [ ] Subcategorías visibles; productos en grilla
- [ ] Local: Chromium de Puppeteer instalado (`npm i`)
