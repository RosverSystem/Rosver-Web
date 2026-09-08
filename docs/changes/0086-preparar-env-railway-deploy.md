# Cambio: Preparar env + scripts deploy Railway

**Fecha:** 2026-09-08  
**Tipo:** chore

## Qué cambió

- `.env` limpio: `RAILWAY_TOKEN` vacío (el UUID anterior era inválido / Unauthorized).
- R2 / Cloudflare intactos en `.env`.
- `RosverSac/.env.example` y `.env.railway.example` (qué va al front vs backend).
- Scripts `scripts/railway-deploy.ps1` y `.sh` (init + Postgres + up + domain).
- Doc `08` con pasos para Account Token de Railway.

## Bloqueo

Sin `RAILWAY_TOKEN` válido no se puede `railway up`. Crear en https://railway.app/account/tokens

## Cómo verificar

- [ ] Pegar Account Token en `.env`
- [ ] `railway whoami` → OK
- [ ] `.\scripts\railway-deploy.ps1` o pedir deploy al agente
