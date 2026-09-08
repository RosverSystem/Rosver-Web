# Cambio: Regla deploy continuo GitHub+Railway (bloqueado por token)

**Fecha:** 2026-09-08  
**Tipo:** docs | chore

## Qué cambió

- Regla `11`: **todo cambio cerrado → push `main` + deploy Railway**.
- Intento de deploy con `RAILWAY_TOKEN` previo (UUID 36 chars): **Unauthorized**.
- Ese valor no es un Account Token de Railway CLI.

## Bloqueo

Sin Account Token válido en `.env` no hay `railway up` ni Postgres en Railway.

## Qué necesita el usuario

1. https://railway.app/account/tokens → **Create** → Account Token  
2. Pegar en `.env`: `RAILWAY_TOKEN=<token largo>`  
3. Decir “despliega” — el agente corre `scripts/railway-deploy.ps1`

## Archivos

- `.cursor/rules/11-despliegues-versiones.mdc`
- `.claude/rules/11-despliegues-versiones.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/changes/0087-regla-deploy-continuo-token-bloqueado.md`
