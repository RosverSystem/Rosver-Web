# Cambio: ERP sidebar colapsable sin perfil duplicado

**Fecha:** 2026-09-08  
**Tipo:** refactor  
**Versión:** 0.1.7

## Qué cambió

- Sidebar blanca colapsable (labels ↔ solo iconos) con perfil **solo al pie** (avatar, nombre, logout).
- Top bar sin saludo/avatar/“Mi cuenta”: título de módulo + búsqueda + reloj.
- Skill `erp-systemrsv-saas-ux`, regla `13` y `docs/architecture/09-erp-systemrsv-ux.md` actualizados (evitar perfil duplicado).
- Fix build Railway: `.npmrc` + `nixpacks.toml` instalan `devDependencies` (`vite`, `@types/*`) para que `tsc -b && vite build` no falle.

## Por qué

Referencias de UX (sidebar tipo Pointscale + navbar limpia) y pedido de no duplicar el perfil entre sidebar y top bar.

## Cómo

Estado `collapsed` en `AdminShell` (persistido en `localStorage`). Drawer móvil siempre expandido. Activo con tokens `rosver-red`.

## Archivos

- `RosverSac/src/app/layout/admin/AdminShell.tsx`
- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `RosverSac/src/app/layout/admin/AdminTopBar.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `.cursor/skills/erp-systemrsv-saas-ux/SKILL.md` (+ espejo Claude)
- `.cursor/rules/13-erp-systemrsv-ux.mdc` (+ espejo Claude)
- `docs/architecture/09-erp-systemrsv-ux.md`
- `docs/pendientes/PENDIENTES.md`
- `RosverSac/nixpacks.toml`
- `RosverSac/.npmrc`
- `RosverSac/package.json` (0.1.7)

## Cómo verificar

- [ ] `/admin` — sidebar blanca; colapsar deja solo iconos
- [ ] Perfil solo al pie del sidebar; top bar sin avatar ni “Mi cuenta”
- [ ] Búsqueda de módulos (⌘K) y hora en top bar
- [ ] Nav: Inicio + Productos (Listado / Categorías / Ofertas)
- [ ] Móvil: drawer; tablet/desktop: rail sticky
- [ ] Deploy Railway responde `/admin`
- [ ] _(Si UI)_ Se ve y usa bien en **móvil** (<768px)
- [ ] _(Si UI)_ Se ve y usa bien en **tablet** (768–1023px)
- [ ] _(Si UI)_ Se ve y usa bien en **desktop** (≥1024px)
