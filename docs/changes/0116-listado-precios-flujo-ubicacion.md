# Cambio: Listado precios — flujo presentación → varios precios

**Fecha:** 2026-09-08  
**Tipo:** fix | ux  
**Versión:** 0.1.24  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Editor de producto en 3 pasos claros:
  1. Tipo de unidad + cantidad → crea presentación
  2. Lista de presentaciones (como ubicaciones); seleccionas una
  3. Varios precios **solo** de esa presentación (venta / mayorista / oferta)
- Quitada la sección global confusa de «Tipos de unidad» en el listado general.
- Crear tipo de unidad solo al armar la presentación.

## Por qué

El flujo anterior mezclaba tipos globales con precios y no dejaba claro: tipo → cantidad → varios precios por esa presentación.

## Cómo verificar

- [ ] Abrir producto en `/admin/listado-precios`
- [ ] Crear Paquete con cantidad 12
- [ ] Seleccionar esa presentación
- [ ] Agregar Venta + Mayorista (desde 1)
- [ ] En tienda se ven ambas presentaciones con sus precios
- [ ] Móvil / tablet / desktop
