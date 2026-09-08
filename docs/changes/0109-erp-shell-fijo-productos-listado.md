# Cambio: ERP sidebar/topbar fijos + Productos vs Listado de precios

**Fecha:** 2026-09-08  
**Tipo:** fix  
**Versión:** 0.1.17

## Qué cambió

- Shell admin `h-dvh overflow-hidden`: sidebar y topbar fijos; solo el contenido hace scroll.
- Lenis desactivado en `/admin` (rompía sticky/scroll).
- Nav: **Productos** (`/admin/productos`) y **Listado de precios** (`/admin/listado-precios`) separados.
- Grupo renombrado a «Catálogo».

## Por qué

Sidebar/topbar se movían al scrollear. «Listado» no era productos: el listado es de precios.

## Cómo

Layout viewport-locked + página de tarifas agregada. Productos sigue siendo el CRUD.

## Archivos

- `RosverSac/src/app/layout/admin/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminTopBar.tsx`, `admin-nav.ts`
- `RosverSac/src/app/providers/SmoothScroll.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `docs/architecture/09-erp-systemrsv-ux.md`

## Cómo verificar

- [ ] En `/admin/categorias` scrollear: sidebar y topbar no se mueven
- [ ] Menú muestra Productos y Listado de precios
- [ ] Listado muestra filas de precios activos
- [ ] Móvil: drawer sigue OK
- [ ] Tienda pública sigue con Lenis
