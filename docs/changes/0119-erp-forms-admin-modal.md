# Cambio: Formularios ERP solo en AdminModal (regla 17)

**Fecha:** 2026-09-08  
**Tipo:** refactor  
**Versión:** 0.1.27

## Qué cambió

- Nueva regla `17-erp-forms-modal` (Cursor `.mdc` + Claude `.md`): en `/admin` alta/edición va en `AdminModal`; **no** aplica a la web pública.
- Paridad en `AGENTS.md`, `CLAUDE.md`, skills ERP UX.
- `AdminOffersPage`: form «Nueva oferta» pasó de card inline a modal (`xl`).
- `AdminCategoriesPage` / `AdminUnitTypesPage`: create/edit en modal.
- `AdminProductsPage`: wizard en modal `xl`; el listado permanece visible.
- `AdminPriceListPage`: crear/editar presentación, precio y tipo de unidad en modales.
- Marcas / almacenamiento ya usaban modal (sin regresión).

## Por qué

Pedido explícito: todo formulario del ERP en modal; la tienda no cambia.

## Cómo

Patrón marcas: listado + CTA → `AdminModal` + form `noValidate` + footer Cancelar/submit; `closeOnEscape={false}` cuando hay picker/upload.

## Archivos

- `.cursor/rules/17-erp-forms-modal.mdc`
- `.claude/rules/17-erp-forms-modal.md`
- `AGENTS.md`, `CLAUDE.md`
- `.cursor/skills/erp-systemrsv-saas-ux/SKILL.md`
- `.claude/skills/erp-systemrsv-saas-ux/SKILL.md`
- `RosverSac/src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminUnitTypesPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `docs/architecture/09-erp-systemrsv-ux.md`
- `docs/pendientes/PENDIENTES.md`
- `docs/pendientes/RECOMENDACIONES.md`
- `RosverSac/package.json`

## Cómo verificar

- [ ] `/admin/ofertas`: listado sin form; «Nueva oferta» abre modal
- [ ] `/admin/categorias` · `/admin/marcas` · productos · listado precios: alta/edición en modal
- [ ] Productos: listado visible con wizard overlay; Cancelar limpia
- [ ] Tienda pública (`/`, `/catalogo`, `/ofertas`) sin cambios de forms
- [ ] Móvil / tablet / desktop: modal usable (bottom-sheet en móvil)
- [ ] Deploy Railway v0.1.27
