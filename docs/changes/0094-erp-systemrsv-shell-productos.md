# Cambio: shell ERP SystemRSV + Productos vacío + regla UX

**Fecha:** 2026-09-08  
**Tipo:** feature | docs  
**Versión:** 0.1.3  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Shell admin estilo bento (referencia dashboard): sidebar oscura iconográfica, top bar con saludo/primer nombre, hora, búsqueda de módulos, menú Mi cuenta.
- Paleta Rosver (ink / soft / red CTA); no mezclar con navbar público.
- Módulo **Productos** en `/admin/productos` vacío (placeholder).
- Regla `13-erp-systemrsv-ux` + `docs/architecture/09-erp-systemrsv-ux.md`.
- Skill `fullstack-erp-structure` (Cursor + Claude).

## Por qué

Unificar el ERP para no mezclar estilos y dejar base para módulos fullstack.

## Archivos

- `RosverSac/src/app/layout/admin/*`
- `AdminDashboardPage`, `AdminProductsPage`
- `.cursor/rules/13-*`, `.claude/rules/13-*`
- `.cursor/skills/fullstack-erp-structure/`, espejo Claude
- `docs/architecture/09-*`, `docs/logica-y-flujos/03-*`

## Cómo verificar

- [ ] Login admin → `/admin` shell nuevo
- [ ] Sidebar navega a Productos (vista vacía)
- [ ] Top bar: saludo, hora, search «productos», Mi cuenta → logout
- [ ] Móvil: botón SR abre drawer sidebar
- [ ] Tablet / desktop OK
