# Cambio: Importar productos Excel ELFA + R2 privado

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- Catálogo local **vacío** (0 productos; secuencia código en 0).
- Botón **Importar productos** en `/admin/productos`.
- Modal grande: subir `.xlsx` (arrastrar o elegir) → animación de subida GSAP → consola → previa → Aceptar / Cancelar / Reintentar.
- Parser del Excel ELFA (código, descripción, contenido, venta público/zona).
- Al aceptar: crea productos + presentaciones + precios; archiva el JSON en bucket R2 **privado** (`rosver-private-docs`, prefijo `imports/products/`).
- Dependencia `xlsx`. Config `R2_BUCKET_PRIVATE`.

- Fix: endpoints en `/api/admin/imports/products/*` (evita choque con `/products/:id` UUID).

## Cómo

- `POST /api/admin/products/import/parse` (multipart)
- `POST /api/admin/products/import/commit` (JSON + `wipeExisting` opcional)
- UI `ProductImportModal` con fases pick → console → preview → commit

## Archivos

- `RosverSac/server/src/lib/elfa-excel-import.ts`
- `RosverSac/server/src/routes/admin-product-import.ts`
- `RosverSac/server/src/lib/r2.ts` / `config.ts`
- `RosverSac/src/features/admin-catalog/ui/ProductImportModal.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API (nuevas rutas + `R2_BUCKET_PRIVATE`)
- [ ] `/admin/productos` → Importar productos → subir Excel ELFA
- [ ] Ver consola animada + previa → Aceptar
- [ ] Listado muestra ~64 productos; JSON en R2 privado
- [ ] Reintentar si falla
- [ ] _(UI)_ Móvil / tablet / desktop
