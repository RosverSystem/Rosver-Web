# Cambio: PDF Chromium en Railway + home más aireado

**Fecha:** 2026-09-14  
**Tipo:** fix

## Qué cambió

- Catálogo PDF en prod: `@sparticuz/chromium` + `puppeteer-core` (ya no depende del Chrome cache de Puppeteer en `/root/.cache`).
- Local sigue con `puppeteer` normal.
- Errores técnicos de Chrome → mensaje corto en español (no el toast enorme).
- Home: más padding/gaps entre secciones (main `gap-20…28`, títulos con más margen, marcas y stats respiran).
- Versión `0.1.65`. Stack actualizado en `04`. R28 cerrado.

## Por qué

Rosa: fallo al generar PDF («Could not find Chrome») y home «todo pegado».

## Archivos

- `RosverSac/server/src/lib/catalog-pdf-render.ts`
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/package.json` (+ lock)
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/BrandCarousel.tsx`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx`
- `RosverSac/src/features/catalog/ui/CampaignLatestSection.tsx`
- `RosverSac/src/features/catalog/ui/TrustStatsSection.tsx`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/changes/0262-pdf-chromium-home-spacing.md`
- `docs/pendientes/PENDIENTES.md`
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [ ] En rosversac.com: «Descargar PDF» / FAB PDF descarga sin error de Chrome
- [ ] Home: más espacio entre hero → marcas → categorías → mayoristas → campaña → cifras
- [ ] Móvil / tablet / desktop
- [ ] Deploy OK
