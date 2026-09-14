# Cambio: Bajar toast Sileo de cookies

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- `SileoToaster` offset `bottom`: `88` → `24` (más cerca del borde inferior).
- Versión `0.1.57`.

## Por qué

La pestaña «Privacidad» quedaba demasiado arriba en el viewport.

## Cómo

Solo ajustar el `offset.bottom` del `Toaster` de Sileo en el layout público.

## Archivos

- `RosverSac/src/app/App.tsx`
- `RosverSac/package.json`
- `docs/changes/0255-sileo-cookie-offset-lower.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] En inicio, sin consentimiento previo: pill «Privacidad» más baja, cerca del borde inferior
- [ ] No tapa del todo los FABs (PDF / WhatsApp) en desktop
- [ ] Móvil: pill visible sin solaparse con la barra de navegación del sistema de forma absurda
- [ ] Tablet / desktop: misma posición relativa
- [ ] Deploy `rosversac.com` con commit de este change
