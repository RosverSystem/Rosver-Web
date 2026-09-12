# Cambio: Plantilla Excel + errores en 1ª consola de import

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- Botón **Descargar plantilla Excel** (hojas INSTRUCCIONES + PRODUCTOS ELFA PACK + NOMBRES, 10 ejemplos con precios público/zona).
- Archivo estático en `public/import-templates/…xlsx` (descarga directa, sin depender de sesión/API).
- Plantilla Excel en **2 hojas**: «Notas y recomendaciones» + «Tabla de importacion» (1 ejemplo).
- Endpoint `GET /api/admin/imports/products/template-xlsx` (backup binario con `Uint8Array`).
- Parser ignora hojas de ayuda y busca cabecera `CODIGO` (compatible con plantilla nueva y Excel ELFA).
- Si el parse encuentra celdas inválidas: **se queda en la 1ª consola** (`parse-issues`) con la lista; no salta a previa. Opción «Continuar con N válidos».
- Al fallar el commit: muestra errores reales de Postgres por SKU (ya no mezcla avisos viejos del Excel).
- Si el SKU ya existe: upsert (actualiza) aunque el INSERT choque por unicidad.
- Menos ruido: filas solo numéricas (ej. «28») no se reportan como SKU inválido.

## Por qué

Hacía falta una plantilla Excel clara y detectar problemas **antes** de la previa. El mensaje «fila 33» en el commit venía de avisos del parse, no del guardado.

## Cómo

- `buildRosverExcelTemplateBuffer()` con `xlsx`.
- Fase UI `parse-issues` + `commitErrors` separados de `compatIssues`.
- Commit: match solo por SKU o `code` explícito del JSON; fallback UPDATE si `products_sku_key`.

## Archivos

- `RosverSac/server/src/lib/elfa-excel-import.ts`
- `RosverSac/server/src/routes/admin-product-import.ts`
- `RosverSac/src/features/admin-catalog/ui/ProductImportModal.tsx`
- `docs/changes/0228-import-plantilla-excel-errores-parse.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API `:8787`
- [ ] Importar → Descargar plantilla Excel → abrir en Excel (3 hojas + ejemplos)
- [ ] Subir Excel con fila basura → 1ª consola lista problemas; **no** previa hasta Continuar / corregir
- [ ] Reimportar SKUs existentes → sobrescrituras > 0 y commit actualiza
- [ ] _(UI)_ Modal ok en móvil / tablet / desktop
