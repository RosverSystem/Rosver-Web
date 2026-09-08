# Cambio: Unidades dentro de Listado de precios (sin menú aparte)

**Fecha:** 2026-09-08  
**Tipo:** fix | ux  
**Versión:** 0.1.21  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Sacó **Unidades** del sidebar Catálogo.
- Tipos de unidad se crean/editan/eliminan en **Listado de precios**.
- `/admin/unidades` redirige a `/admin/listado-precios`.

## Por qué

Las unidades son parte del flujo de presentaciones/precios, no un módulo suelto.

## Archivos

- `AdminPriceListPage.tsx`, `admin-nav.ts`, `App.tsx`
- `docs/architecture/09-erp-systemrsv-ux.md`, skills ERP UX

## Cómo verificar

- [ ] Sidebar Catálogo sin ítem Unidades
- [ ] `/admin/listado-precios` muestra «Tipos de unidad» + productos
- [ ] `/admin/unidades` redirige al listado
- [ ] Crear Caja y usarla en presentación de un producto
- [ ] Móvil / tablet / desktop
