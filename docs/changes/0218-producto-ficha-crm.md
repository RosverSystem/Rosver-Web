# Cambio: Producto en ficha CRM (sin modal)

**Fecha:** 2026-09-11  
**Tipo:** refactor

## Qué cambió

- Alta/edición de productos dejó el `AdminModal` y pasó a una **ficha de página completa** estilo CRM.
- Rutas: `/admin/productos` (solo listado), `/admin/productos/nuevo`, `/admin/productos/:id`.
- Nueva página `AdminProductWorkspacePage`: cabecera + barra de fases + pestañas (Datos · Detalle · Precios · Especs) + vista previa tienda.
- Regla `17`, skills ERP UX, `AGENTS.md` y `09-erp-systemrsv-ux.md`: excepción explícita Productos → ficha CRM.

## Por qué

El wizard multipaso en modal era incómodo (espacio, preview, fases). Patrón Urbany/CRM: listado corto + ficha rica.

## Cómo

- Lógica del wizard extraída a `AdminProductWorkspacePage`; APIs sin cambio.
- En **nuevo**, solo fase Datos hasta crear; luego redirect a `/:id` y se habilitan el resto de pestañas.
- `AdminProductsPage` navega a las rutas de ficha (Nuevo / Editar).

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminProductWorkspacePage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/index.ts`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `.cursor/rules/17-erp-forms-modal.mdc` + `.claude/rules/17-erp-forms-modal.md`
- `.cursor/skills/erp-systemrsv-saas-ux/SKILL.md` + `.claude/skills/...`
- `AGENTS.md`, `docs/architecture/09-erp-systemrsv-ux.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/productos` muestra listado; «Nuevo producto» abre `/admin/productos/nuevo`
- [ ] Guardar fase Datos crea el producto y redirige a `/admin/productos/:id`
- [ ] En edición: pestañas Detalle / Precios / Especs y preview en desktop
- [ ] Lápiz en listado abre la ficha del producto
- [ ] Volver / Ocultar regresan al listado
- [ ] _(UI)_ Móvil: ficha usable (preview debajo o colapsable)
- [ ] _(UI)_ Tablet / desktop: cabecera + fases + preview sticky a la derecha
- [ ] Sin regresiones en Presentaciones / Categorías / Marcas (siguen en modal)
