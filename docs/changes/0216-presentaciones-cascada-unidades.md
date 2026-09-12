# Cambio: Presentaciones — cascada unidad/cantidad + rename

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Menú y títulos: **Presentaciones** (antes «Listado de precios»).
- Vista tipo ubigeo: panel **Tipo de unidad** + panel **Cantidades** con CRUD.
- Migración `028_unit_type_quantities.sql` + API cantidades por unidad.
- Debajo sigue la tabla de precios por producto.

## Archivos

- `RosverSac/server/sql/028_unit_type_quantities.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminUnitQtyCascade.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `docs/architecture/09-erp-systemrsv-ux.md`
- `docs/changes/0216-presentaciones-cascada-unidades.md`

## Cómo verificar

- [ ] Sidebar muestra **Presentaciones**
- [ ] Clic en Caja → panel derecho con cantidades; alta/edición/borrado OK
- [ ] Crear tipo nuevo y cantidades 10/20/100
- [ ] Tabla de productos abajo sigue abriendo precios
