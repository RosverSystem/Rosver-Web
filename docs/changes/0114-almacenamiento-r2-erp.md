# Cambio: Módulo Almacenamiento R2 (ERP)

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.22  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Nuevo módulo **Almacenamiento** en el ERP (`/admin/almacenamiento`).
- Lista archivos de R2 por carpeta (productos, categorías, marcas, avatares).
- Preview en **modal** (imagen grande + metadatos + copiar URL + eliminar).
- Subida de imágenes desde el módulo.
- API: `GET/DELETE /api/admin/storage`, `POST /api/admin/storage/upload`.
- `AdminModal` compartido en `shared/ui`.

## Por qué

Gestionar medios R2 con vista ERP organizada, no solo subidas embebidas en formularios.

## Archivos

- `RosverSac/server/src/lib/r2.ts`
- `RosverSac/server/src/routes/admin-storage.ts`
- `RosverSac/src/features/admin-media/`
- `RosverSac/src/shared/ui/admin-modal.tsx`
- `admin-nav.ts`, `App.tsx`, docs feature/architecture

## Cómo verificar

- [ ] `/admin/almacenamiento` en sidebar
- [ ] Ver thumbs de imágenes existentes
- [ ] Abrir modal preview
- [ ] Subir a Productos y aparece en grid
- [ ] Eliminar con confirmación
- [ ] Móvil / tablet / desktop
