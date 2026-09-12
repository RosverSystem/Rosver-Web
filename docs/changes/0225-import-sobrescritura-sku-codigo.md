# Cambio: Importación — advertencia y sobrescritura por SKU/código

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- Si un producto del archivo coincide por **SKU** o por **código interno**, al confirmar se **actualiza** (nombre, marca, precios) en lugar de crear uno nuevo.
- El parse (`POST …/imports/products/parse`) devuelve `overwrites[]` con los productos existentes afectados.
- La previa del modal muestra banner de advertencia, contador «Se sobrescriben», filas marcadas y botón con el número de sobrescrituras.
- Al terminar: resumen con **Creados** + **Actualizados**.
- JSON Rosver admite campo opcional `code` (número interno).

## Por qué

Reimportar el Excel ELFA (o JSON) no debe duplicar productos: hay que avisar qué se va a reemplazar y conservar el código interno.

## Cómo

- Match: `UPPER(sku)` o `products.code` (si el draft trae `code` o un SKU solo numérico 1–8 dígitos).
- Commit: `UPDATE` + reemplazo de empaques/precios; el `code` interno no se regenera.
- UI: lista amarilla + columna Estado (Nuevo / Sobrescribe).

## Archivos

- `RosverSac/server/src/routes/admin-product-import.ts`
- `RosverSac/server/src/lib/elfa-excel-import.ts`
- `RosverSac/src/features/admin-catalog/ui/ProductImportModal.tsx`
- `docs/changes/0225-import-sobrescritura-sku-codigo.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Importar Excel con productos ya cargados → previa lista «se sobrescribirán» con SKU y cód. interno
- [ ] Aceptar → creados = nuevos, actualizados = coincidentes; sin duplicados de SKU
- [ ] Consola muestra líneas `! advertencia` y al commit `actualizados: N`
- [ ] _(UI)_ Banner y tabla legibles en **móvil**, **tablet** y **desktop**
- [ ] Reiniciar API local si el parse no trae `overwrites`
