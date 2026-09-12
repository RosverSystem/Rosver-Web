# Cambio: Listado de precios — tabla Bootstrap

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- `/admin/listado-precios` listado de productos: tabla Bootstrap (thumb, nombre + código, SKU, marca, categoría) + icono Editar para abrir presentaciones/precios.
- Buscador con icono, conteo, paginación (10).
- Cabecera del detalle de producto alineada al estilo ERP (banda ink→blue).

## Por qué

Paridad con Productos / Pedidos / Cotizaciones / Reclamaciones.

## Cómo

Solo UI del listado y cabecera de detalle en `AdminPriceListPage`. Flujo presentaciones/precios y modales sin cambio de lógica.

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `docs/changes/0209-listado-precios-tabla-bootstrap.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/listado-precios` muestra tabla con columnas y miniatura
- [ ] Buscar filtra; paginación funciona
- [ ] Icono Pen / clic en producto abre presentaciones y precios
- [ ] «← Todos los productos» vuelve al listado
- [ ] _(UI)_ Móvil / tablet / desktop (scroll horizontal de tabla OK en móvil)
