# Cambio: Logo de correo por CDN Cloudflare (no Railway)

**Fecha:** 2026-09-12  
**Tipo:** fix

## Qué cambió

- Correos OTP/bienvenida usan el logo en **`https://rosversac.com/logo_confondo.png`** (estático + CDN Cloudflare), no `/api/media` vía `APP_URL` de Railway.
- `absoluteBrandUrl` ignora hosts `.up.railway.app` / localhost para assets de marca.
- `siteBaseUrl()` en mails apunta siempre al dominio canónico si `APP_URL` es efímero.
- Railway: `APP_URL` y `API_URL` → `https://rosversac.com`.
- Versión `0.1.49`.

## Por qué

Gmail mostraba el icono roto “Rosver SAC”: el HTML pedía  
`https://rosver-web-production.up.railway.app/api/media/brand/logo-confondo.png` → **404**.  
En el dominio público (Cloudflare) el mismo archivo responde **200**.

## Cómo

Mapa `EMAIL_CDN_LOGOS` en `brand-assets.ts` → archivos de `public/` ya desplegados detrás de Cloudflare.  
Opcional futuro: `R2_PUBLIC_BASE_URL` (r2.dev) si se habilita acceso público del bucket en el dashboard de Cloudflare.

## Archivos

- `RosverSac/server/src/lib/brand-assets.ts`
- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/package.json`
- `docs/changes/0247-email-logo-cdn-cloudflare.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `curl -I https://rosversac.com/logo_confondo.png` → 200 `image/png`
- [ ] Pedir OTP → correo con logo visible (no placeholder roto)
- [ ] Enlaces del mail abren `https://rosversac.com/…`
- [ ] _(UI mail)_ Se ve bien en móvil / desktop del cliente de correo
