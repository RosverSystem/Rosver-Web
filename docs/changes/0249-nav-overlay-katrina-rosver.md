# Cambio: Menú overlay oscuro estilo Katrina + animaciones

**Fecha:** 2026-09-13  
**Tipo:** feature

## Qué cambió

- Botón hamburguesa (móvil y desktop) abre un **overlay full-screen** oscuro estilo Katrina Imports, con marca Rosver.
- Animaciones de entrada/salida (Motion) + stagger de links; Escape y botón X cierran; bloqueo de scroll.
- Links: Catálogo, Destacados, Ubicación y envíos, Mi cotización; pills WhatsApp/email; redes; radar decorativo en desktop.
- Header: pill rojo «Mi cotización» (sm+) + hamburguesa siempre visible.
- Versión `0.1.51`.

## Por qué

Rosa pidió replicar la vista del menú de referencia con animaciones de abrir/salir y paleta Rosver.

## Cómo

- Nuevo `PublicNavOverlay` montado desde `PublicNavbar`.
- Reemplaza el drawer blanco colapsable solo-móvil.

## Archivos

- `RosverSac/src/app/layout/PublicNavOverlay.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/package.json`
- `docs/changes/0249-nav-overlay-katrina-rosver.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Clic en hamburguesa → overlay oscuro entra animado
- [ ] X / Escape / navegar → sale animado
- [ ] WhatsApp y email abren correctamente
- [ ] Móvil: una columna; desktop: nav + branding
- [ ] Pill «Mi cotización» visible en tablet/desktop
- [ ] Deploy en rosversac.com
