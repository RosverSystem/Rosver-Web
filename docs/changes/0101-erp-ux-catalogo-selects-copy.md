# Cambio: UX ERP catálogo — cards, selects y copy claro

**Fecha:** 2026-09-08  
**Tipo:** refactor  
**Versión:** 0.1.10

## Qué cambió

- Rediseño Marcas / Categorías / Productos: cards y filas densas (menos “tabla plana”).
- Quitados textos de ayuda técnicos bajo títulos.
- `AdminSelect` / `AdminField` / `AdminPageHeader` compartidos.
- Regla `14-erp-selects-copy` (Cursor + Claude): selects con estilo Rosver y lenguaje cotidiano (“Categoría principal”, “Dentro de…”, no “sin padre”).
- Skill ERP actualizada con anti-patrones de jerga/ayuda.

## Por qué

UX pedida: fácil para usuario no técnico; selects entendibles; estilo ERP SaaS.

## Archivos

- `RosverSac/src/shared/ui/admin-field.tsx`
- `RosverSac/src/features/admin-catalog/ui/Admin{Brands,Categories,Products,Offers}Page.tsx`
- `.cursor/rules/14-erp-selects-copy.mdc` (+ Claude)
- Skills `erp-systemrsv-saas-ux`, `AGENTS.md`, `CLAUDE.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/categorias` — sin “sin padre”; opción “Categoría principal (menú)”
- [ ] `/admin/marcas` — cards, sin párrafo de ayuda
- [ ] `/admin/productos` — listado tipo cards + panel presentaciones/precios
- [ ] Selects con chevron y focus rojo
- [ ] Móvil / tablet / desktop
- [ ] Deploy Railway
