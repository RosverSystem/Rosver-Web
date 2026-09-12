# Cambio: Sidebar admin colapsada — sin letras P/L/C

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Sidebar colapsada: el grupo Catálogo ya no muestra letras sueltas (P, L, C, M, O).
- Solo icono del grupo; al clic abre Productos.
- Botón expandir reposicionado (menos solape con el borde).
- Scroll del nav más discreto (`scrollbar-width: thin`).

## Por qué

Rosa reportó errores visuales en el menú colapsado.

## Cómo

En `AdminSidebar`, modo colapsado del group deja de mapear `child.name.slice(0, 1)`.

## Archivos

- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `docs/changes/0193-sidebar-colapsada-sin-letras.md`

## Cómo verificar

- [ ] Colapsar sidebar: solo iconos, sin P/L/C/M/O
- [ ] Botón circular expandir visible y usable
- [ ] Expandir: Catálogo muestra Productos / Listado / etc. normales
- [ ] Desktop ≥1024px
