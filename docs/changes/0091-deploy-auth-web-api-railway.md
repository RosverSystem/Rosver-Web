# Cambio: Deploy auth unificado web+API en Railway

**Fecha:** 2026-09-08  
**Tipo:** chore | feature

## Qué cambió

- Auth RBAC/OTP/perfil desplegable: un solo servicio `Rosver-Web` sirve `dist` + `/api/*` (Hono).
- `railway.toml`: `build` Vite + `start` `npx tsx server/src/boot.ts` (migrate → seed → server).
- `tsx` en dependencies de producción.
- `PORT` Railway; SMTP Hostinger listo vía variables (no en git).
- Docs `08` / `0090` / `0091`.

## Por qué

Regla 11: todo cambio cerrado → GitHub `main` + Railway. Misma origen evita problemas de cookies cross-site.

## Cómo verificar

- [ ] Push `main` + deploy SUCCESS
- [ ] `https://rosver-web-production.up.railway.app/api/health` → 200
- [ ] Login admin → `/admin`
- [ ] Login cliente → `/cuenta/perfil`
- [ ] OTP llega por SMTP si `SMTP_PASS` está en Railway
