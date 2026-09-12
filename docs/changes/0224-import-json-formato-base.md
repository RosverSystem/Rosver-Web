# Cambio: Parser ELFA + formato JSON de importación

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- Parser Excel ELFA corrige precios `S/ 65.00` y descripción en stretch film (columna distinta).
- Formato oficial JSON `rosver-products-import` v1.
- Import acepta `.xlsx` y `.json`.
- Descargas: plantilla ejemplo + JSON ELFA completo (64 productos).
- Archivos en `server/data/import-templates/`.

## Por qué

La plantilla comercial real no es una tabla plana; hace falta un formato estable para reimportar sin pelear con el Excel.

## Archivos

- `RosverSac/server/src/lib/elfa-excel-import.ts`
- `RosverSac/server/src/routes/admin-product-import.ts`
- `RosverSac/server/data/import-templates/*`
- `RosverSac/src/features/admin-catalog/ui/ProductImportModal.tsx`

## Cómo verificar

- [ ] Reiniciar API
- [ ] Importar `PRODUCTO ELFA COD ACTUALIZACION.xlsx` → 64 productos con precios
- [ ] Descargar plantilla JSON / JSON ELFA desde el modal
- [ ] Reimportar el JSON ELFA
