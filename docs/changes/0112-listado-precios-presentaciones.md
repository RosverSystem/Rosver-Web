# Cambio: Listado de precios — presentaciones con unidades + precios

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.20  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- `/admin/listado-precios` deja de ser solo lectura: eliges producto y **creas presentaciones** (nombre, tipo de unidad, **cuántas unidades**).
- Puedes tener **varias presentaciones** (Unidad × 1, Caja × 12, etc.) y **precio por cada una** (venta / mayorista / oferta).
- API: `DELETE` presentación y desactivar precio.
- Labels de presentación muestran unidades con claridad.

## Por qué

El listado anterior era una tabla pasiva; el pedido era crear presentaciones con N unidades y precios por opción.

## Cómo

Editor por producto en `AdminPriceListPage` + endpoints packaging/price existentes ampliados.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/listado-precios` → abrir un producto
- [ ] Agregar presentación «Caja» con 12 unidades
- [ ] Guardar precio de venta para esa caja
- [ ] Agregar otra presentación (Unidad × 1) con otro precio
- [ ] Eliminar / quitar precio funciona
- [ ] Móvil / tablet / desktop
