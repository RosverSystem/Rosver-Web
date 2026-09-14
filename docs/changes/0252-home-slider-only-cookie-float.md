# Cambio: Home solo slider + noti flotante de cookies

**Fecha:** 2026-09-13  
**Tipo:** feature

## Qué cambió

- Home: **solo** `HeroWaveSlider` (sin categorías / mayoristas / campaña en pantalla).
- Hero sin paneles Unsplash: `HOME_HERO_PANELS = []`; CMS solo aporta slides con `imageUrl` real.
- Seed `home_hero` por defecto: `{ slides: [] }`.
- Nueva **noti flotante de cookies/permisos** (`CookieConsentFloat`): bubble + tab estilo Sileo, paleta Rosver; guarda `all` | `necessary` en `localStorage`.
- Versión `0.1.54`.

## Por qué

Rosa pidió quitar datos mock del home (dejar el slider) y agregar aviso de permiso/cookies al estilo de las referencias.

## Archivos

- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/model/home-hero-slides.ts`
- `RosverSac/server/src/routes/admin-content.ts`
- `RosverSac/src/shared/ui/cookie-consent-float.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/package.json`
- `docs/changes/0252-home-slider-only-cookie-float.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` solo muestra hero (CTA + barra valor; paneles solo si CMS tiene imagen)
- [ ] Primera visita: aparece noti flotante abajo
- [ ] «Aceptar todas» / «Solo necesarias» la cierran y no vuelve al recargar
- [ ] Móvil: no tapa el FAB WhatsApp de forma bloqueante
- [ ] Deploy rosversac.com
