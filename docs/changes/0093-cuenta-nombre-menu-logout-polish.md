# Cambio: cuenta UI — primer nombre + menú logout + polish

**Fecha:** 2026-09-08  
**Tipo:** fix | feature  
**Versión:** 0.1.2  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Header muestra **primer nombre** real (`Andrés` si el seed es `Andrés Acosta`; si el nombre empezaba por «Cliente»+apellido, usa el apellido para no confundir con el rol).
- **Cerrar sesión** solo dentro del desplegable (quitado el botón suelto de `/cuenta`).
- Menú de sesión ya no se corta: `overflow-x-hidden` fuera del navbar.
- Vistas cuenta (resumen, pedidos, cotizaciones, layout) menos wireframe / más pulidas.
- Seed cliente: `Andrés Acosta` (se actualiza en boot Railway).

## Por qué

Se veía «Cliente» (rol/nombre seed) y el logout flotaba fuera del menú por clipping CSS.

## Archivos

- `SessionAccountMenu.tsx`, `PublicNavbar.tsx`, `App.tsx`
- `AccountLayout/Overview/Orders`, `ClientQuotesPage`, `AccountProfilePage`
- `server/src/seed.ts`

## Cómo verificar

- [ ] Login → header dice **Andrés** (no «Cliente»)
- [ ] Desplegable completo con Cerrar sesión dentro
- [ ] `/cuenta` sin botón Cerrar sesión suelto; saludo con primer nombre
- [ ] Móvil / tablet / desktop OK
