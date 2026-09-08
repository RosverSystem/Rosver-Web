# Cambio: Marcas en modal + selector R2 tipo Drive

**Fecha:** 2026-09-08  
**Tipo:** feature | ux  
**Versión:** 0.1.23  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Alta/edición de **marcas en modal** (ya no form inline en la página).
- `AdminMediaPicker`: buscar en R2, elegir imagen existente o subir nueva **pidiendo nombre**.
- `AdminImageUpload` abre el picker (estilo Drive).
- Upload API acepta `name` / `displayName` para la clave en R2.

## Por qué

Evitar formularios largos en página y reutilizar medios ya guardados en Cloudflare R2.

## Archivos

- `AdminBrandsPage.tsx`, `admin-media-picker.tsx`, `admin-image-upload.tsx`, `admin-modal.tsx`
- `upload-image.ts`, `admin-catalog.ts` uploads, `admin-storage.ts`

## Cómo verificar

- [ ] `/admin/marcas` → Nueva marca abre modal
- [ ] Elegir imagen → grid R2 + buscador
- [ ] Subir nueva pide nombre y guarda en `brands/`
- [ ] Seleccionar existente asigna el logo
- [ ] Móvil / tablet / desktop
