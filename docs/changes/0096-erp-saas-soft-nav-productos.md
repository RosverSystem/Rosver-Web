# Cambio: ERP SaaS soft — solo Inicio + Productos

**Fecha:** 2026-09-08  
**Tipo:** feature | docs  
**Versión:** 0.1.5  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Nuevo modelo UX ERP (sidebar blanca con labels, search ⌘K, perfil) con paleta Rosver.
- Skill `erp-systemrsv-saas-ux` + regla `13` actualizada.
- Nav reducida a: **Inicio**, **Productos** → Listado / Categorías / Ofertas.
- Vistas en blanco; rutas legacy admin (pedidos, leads, etc.) quitadas del router.

## Archivos

- `app/layout/admin/*`
- `features/admin-catalog` (Offers + blanks)
- `.cursor/skills/erp-systemrsv-saas-ux/`, espejo Claude
- `docs/architecture/09-*`, `03-*`, features, change

## Cómo verificar

- [ ] `/admin` sidebar blanca · Inicio activo en rojo
- [ ] Grupo Productos abre Listado / Categorías / Ofertas
- [ ] Vistas vacías con card blanca
- [ ] Top bar search + perfil + logout en menú
- [ ] Móvil: drawer sidebar
- [ ] Tablet / desktop OK
