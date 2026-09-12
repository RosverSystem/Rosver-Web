# Cambio: Fix F5 en import Excel (Vite + writeFile)

**Fecha:** 2026-09-11  
**Tipo:** fix

## Qué cambió

- El parse de Excel **ya no escribe** `products-elfa-from-xlsx.json` en `server/data/` (eso disparaba el watcher de Vite y recargaba la SPA como F5 al llegar a «formato: PRODUCTOS ELFA PACK»).
- Vite ignora cambios en `server/data/**`, `server/sql/**` y logs.
- Tras el parse, la consola vuelca el resultado en **un solo setState** y pasa a la previa; menos riesgo de quedar a medias.
- La respuesta de parse ya no incluye el `rosverJson` duplicado (más liviana).

## Por qué

Al convertir el Excel, la API hacía `writeFileSync` dentro del proyecto. Vite detectaba el cambio y reiniciaba la página justo cuando la consola mostraba la hoja detectada.

## Cómo

- Quitar side-effect de disco en `POST …/imports/products/parse`.
- `server.watch.ignored` en `vite.config.ts`.
- `pushLines` + validación null-safe de `stats` / `name` en el modal.

## Archivos

- `RosverSac/server/src/routes/admin-product-import.ts`
- `RosverSac/vite.config.ts`
- `RosverSac/src/features/admin-catalog/ui/ProductImportModal.tsx`
- `docs/changes/0226-fix-import-f5-vite-write.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar **Vite** (`npm run dev`) y la **API** (`:8787`)
- [ ] Importar `PRODUCTO ELFA COD ACTUALIZACION.xlsx` → consola completa → previa (sin F5)
- [ ] Aceptar e importar llega a «done»
- [ ] _(UI)_ Modal usable en móvil / tablet / desktop
