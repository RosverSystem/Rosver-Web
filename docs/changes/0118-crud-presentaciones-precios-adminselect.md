# Cambio: CRUD completo presentaciones/precios + AdminSelect

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.26

## Qué cambió

- API `PATCH /api/admin/products/:id/packagings/:packagingId` (editar tipo, cantidad, nombre, principal).
- Listado de precios: C/R/U/D de presentaciones, precios y tipos de unidad (crear / renombrar / borrar).
- Productos (fase 3): eliminar presentación; editar y quitar precios.
- Selects admin con `AdminSelect` + copy cotidiano (categoría «Dentro de…», labels claros).
- Wireframe Usuarios: rol con `AdminSelect` y etiquetas en español.

## Por qué

Reglas `16` (CRUD completo) y `14` (selects ERP / sin jerga). El listado y el wizard dejaban crear sin editar/borrar de forma usable.

## Cómo

- Misma UI de listado (presentación → precios) con formularios de edición y confirmación al borrar.
- Tipos de unidad inline en listado (chips Editar/Borrar) usando API ya existente.
- Precios: `POST` con `id` + `saveAsNew: false` para update; `DELETE` para quitar.

## Archivos

- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-users/ui/AdminUsersPage.tsx`
- `RosverSac/package.json`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/listado-precios` → producto → crear presentación con precio
- [ ] Editar presentación, marcar principal, eliminar
- [ ] Agregar / editar / quitar precios bajo la presentación
- [ ] Crear tipo de unidad, renombrar y borrar (si no está en uso)
- [ ] `/admin/productos` → fase 3: eliminar presentación; Editar/Quitar precio
- [ ] Selects con estilo Rosver (borde, flecha, alto ~44px)
- [ ] Móvil / tablet / desktop: formularios en columna sin overflow
- [ ] Deploy Railway responde con v0.1.26
