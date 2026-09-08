# Cambio: Regla deploys + docs R2/Postgres + intento Railway 0.1.0

**Fecha:** 2026-09-07  
**Tipo:** docs | chore

## Qué cambió

- Regla `11-despliegues-versiones` (Cursor + Claude) y punteros en `AGENTS.md` / `CLAUDE.md`.
- Doc `docs/architecture/08-despliegue-y-almacenamiento.md` (Railway, Postgres, R2, permisos token Cloudflare).
- `RosverSac/railway.toml` (build Vite + `serve -s` SPA).
- Versión app → `0.1.0`.
- Intento de auth Railway CLI con token en `.env`: **Unauthorized** — falta token válido de Railway.

## Por qué

Documentar despliegues/versiones; preparar web + Postgres + R2; desplegar cuando haya token Railway correcto.

## Archivos

- `.cursor/rules/11-despliegues-versiones.mdc`
- `.claude/rules/11-despliegues-versiones.md`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `RosverSac/railway.toml`
- `RosverSac/package.json`
- `docs/changes/0083-despliegue-docs-r2-railway.md`

## Cómo verificar

- [ ] Leer `08-despliegue-y-almacenamiento.md` — permisos R2 claros
- [ ] Crear token Cloudflare con Account → Cloudflare R2 → Edit + Account Settings → Read
- [ ] Generar token Railway en https://railway.app/account/tokens y actualizar `.env` (`RAILWAY_TOKEN=…`)
- [ ] Reintentar: `railway whoami` → OK → deploy + Postgres
