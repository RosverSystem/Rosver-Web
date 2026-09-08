# Cambio: Subir imagen en admin (botón primario, URL opcional)

**Fecha:** 2026-09-08  
**Tipo:** fix  
**Versión:** 0.1.16

## Qué cambió

- `AdminImageUpload`: botón **Subir imagen** / **Cambiar imagen** como acción principal; URL solo si el usuario la despliega.
- Categorías: deja de verse solo el campo «URL de imagen».

## Por qué

En producción aún se veía (o se percibía) solo pegar URL; hace falta subir archivo desde el PC sin tener link.

## Cómo

Mismo `POST /api/admin/uploads` → R2; el control oculta el file input nativo detrás del CTA rojo.

## Archivos

- `RosverSac/src/shared/ui/admin-image-upload.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `RosverSac/package.json`

## Cómo verificar

- [ ] `/admin/categorias` → card inicio → **Subir imagen** abre el explorador de archivos
- [ ] Tras subir, aparece preview; guardar categoría OK
- [ ] Opcional: «¿Ya tienes una URL?» sigue disponible
- [ ] Mismo control en marcas y productos
- [ ] Móvil / tablet / desktop
