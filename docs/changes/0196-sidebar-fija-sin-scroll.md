# Cambio: Sidebar admin fija (sin colapsar) y sin scrollbar visible

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Sidebar desktop **siempre expandida** (se quitó el botón hamburguesa de colapsar).
- Scroll del menú **invisible** (sigue funcionando con la rueda).
- Se limpia `localStorage` de colapso previo.
- En móvil se mantiene el drawer (menú desde top bar).

## Por qué

Rosa no quiere poder contraer el sidebar ni ver la barra de scroll.

## Nota

`localhost:8787` sirve `dist/` — hace falta `npm run build` (o usar Vite `:5173`) para ver el cambio.

## Archivos

- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `RosverSac/src/app/layout/admin/AdminShell.tsx`
- `docs/changes/0196-sidebar-fija-sin-scroll.md`

## Cómo verificar

- [ ] Desktop: no hay icono de colapsar en el header del sidebar
- [ ] No se ve scrollbar en el menú lateral
- [ ] Con rueda del mouse el menú aún scrollea si hay muchos ítems
- [ ] Móvil: menú desde top bar sigue OK
