# Cambio: Cookies con librería Sileo (estilo real)

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Instalado **`sileo`** (`npm i sileo`) — toast físico bubble + tab.
- `CookieConsentFloat` ya no es Motion casero: usa `sileo.action` (tab «Privacidad», «Aceptar todas», «Solo necesarias»).
- `Toaster` de Sileo en layout público (`bottom-center`, theme dark, offset sobre WhatsApp).
- Acento Rosver vía CSS (`--sileo-state-action: #E30613` + clases).
- Stack documentado en `04-stack-y-librerias.md`. Versión `0.1.56`.

## Por qué

La noti anterior no se parecía a Sileo; Rosa pidió usar esa librería.

## Archivos

- `RosverSac/package.json` (+ lock)
- `RosverSac/src/shared/ui/cookie-consent-float.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/main.tsx`
- `RosverSac/src/styles/global.css`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/changes/0254-sileo-cookie-consent.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Primera visita (sin `localStorage.rosver.cookieConsent`): toast Sileo abajo al centro
- [ ] Hover/tap expande bubble con botones
- [ ] Tab inferior dice «Privacidad» en rojo Rosver
- [ ] Aceptar / Solo necesarias cierra y no vuelve
- [ ] Deploy rosversac.com
