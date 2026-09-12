# Cambio: Plantilla Excel con color y merges (2 hojas)

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Plantilla regenerada con **ExcelJS**: colores Rosver, celdas combinadas correctas, 2 hojas.
- «Notas y recomendaciones» + «Tabla de importacion» (1 ejemplo en amarillo).
- Grupos: DATOS DEL PRODUCTO | VENTA PÚBLICO | VENTA ZONA.
- Layout columnas B–J igual al Excel ELFA → el importador acepta **ambos**.
- Dependencia `exceljs` documentada en stack.

## Por qué

La plantilla anterior se veía plana y los merges no se entendían bien; hace falta una vista clara y seguir leyendo el Excel ELFA comercial.

## Cómo

- `buildRosverExcelTemplateBuffer()` async con ExcelJS.
- Archivos estáticos en `public/` y `server/data/import-templates/`.
- Parser sigue con `xlsx`; ignora hojas de notas.

## Archivos

- `RosverSac/server/src/lib/elfa-excel-import.ts`
- `RosverSac/public/import-templates/rosver-productos-importacion-plantilla.xlsx`
- `RosverSac/server/data/import-templates/rosver-productos-importacion-plantilla.xlsx`
- `RosverSac/package.json`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/changes/0229-plantilla-excel-colores-merges.md`

## Cómo verificar

- [ ] Descargar plantilla → 2 hojas, colores, merges de VENTA PÚBLICO (F–H) y VENTA ZONA (I–J)
- [ ] Importar esa plantilla → 1 producto ejemplo OK
- [ ] Importar Excel ELFA original → sigue detectando productos
- [ ] _(UI)_ Botón descarga sin error de sesión
