# Cambio: Almacenamiento «Todos» lista archivos de todas las carpetas

**Fecha:** 2026-09-08  
**Tipo:** fix  
**Versión:** 0.1.29

## Qué cambió

- `GET /api/admin/storage` sin `Delimiter` en listado R2: «Todos» ahora incluye claves `products/…`, `brands/…`, etc.
- Grid: badge de carpeta en vista Todos; copy vacío más claro.

## Por qué

Con `groupFolders: !prefix`, S3 devolvía solo CommonPrefixes y el grid de «Todos» quedaba vacío aunque hubiera archivos en subcarpetas.

## Cómo

`listPublicObjects({ groupFolders: false })` siempre al listar archivos.

## Archivos

- `RosverSac/server/src/routes/admin-storage.ts`
- `RosverSac/src/features/admin-media/ui/AdminStoragePage.tsx`
- `RosverSac/package.json`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/almacenamiento` → Todos: se ven imágenes de products/categories/brands
- [ ] Filtro Productos / Marcas sigue filtrando por prefix
- [ ] «Cargar más» si hay más de ~200 objetos
- [ ] Deploy Railway v0.1.29
