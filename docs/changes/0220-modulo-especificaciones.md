# Cambio: Módulo Especificaciones (tipos de ficha técnica)

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- Nuevo módulo ERP **Especificaciones** en `/admin/especificaciones`.
- Solo **ficha técnica** (Dimensiones, Peso, Material…). Código/SKU/marca/MOQ quedan en «Especificaciones de tienda» del producto (no editables aquí).
- Al crear: escribes el **nombre**; la **clave se genera sola**.
- Defaults técnicos del sistema: editables en nombre/unidad, no se borran.
- Migraciones `032` + `033` (`is_system`, `is_catalog`).

## Por qué

Igual que Presentaciones define tipos de unidad, hace falta un catálogo de tipos de ficha técnica reutilizable en productos, sin perder los defaults ya sembrados.

## Cómo

- UI `AdminSpecsPage` con búsqueda, badges Sistema/Personalizada e iconos CRUD.
- Producto (fase Especs) sigue usando `GET /spec-attributes` para sugerencias.

## Archivos

- `RosverSac/server/sql/032_spec_attributes_system.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminSpecsPage.tsx`
- `RosverSac/src/features/admin-catalog/index.ts`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `docs/features/admin-catalog.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API + `npm run db:migrate` (032)
- [ ] Menú Catálogo → Especificaciones
- [ ] Ver defaults con badge Sistema; no se pueden borrar
- [ ] Crear una personalizada, editarla y eliminarla
- [ ] En producto → Especs, el nuevo tipo aparece como sugerencia
- [ ] _(UI)_ Móvil / tablet / desktop
