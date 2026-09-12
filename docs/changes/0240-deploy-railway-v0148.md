# Cambio: Deploy Railway v0.1.48 (cierre pendientes)

**Fecha:** 2026-09-12  
**Tipo:** chore

## Qué cambió

- Confirmado `main` en GitHub al día (`Everything up-to-date`) con el cierre 0230–0239 / v0.1.48.
- Deploy a Railway vía `scripts/railway-deploy.ps1` (commit SHA forzado en `.deploy-commit`).
- Verificación de `/api/health` en producción.

## Por qué

Pedido: subir a GitHub y desplegar en Railway para probar en línea el cierre de pendientes.

## Cómo

Árbol ya pusheado; solo redeploy del servicio `Rosver-Web` en proyecto `rosver-web`. Sin bump de versión (sigue `0.1.48`).

## Archivos

- `scripts/railway-deploy.ps1` (ejecutado)
- `docs/changes/0240-deploy-railway-v0148.md`

## Cómo verificar

- [x] `main` en GitHub al día (`c1792c8` + cierre previos)
- [x] Deploy Railway **SUCCESS** (NIXPACKS + `boot.ts`; healthcheck OK)
- [x] `https://rosversac.com/api/health` → `ok: true`
- [x] Confirmar `commitSha` en health = `c1792c8…` (coincide con `main`)
- [x] SPA `/catalogo` y `/admin` responden
- [ ] Opcional prod: `npm run db:migrate-offers-to-combos -- --apply` (P130-ops)
- [ ] BLOQUEADO EXTERNO: Google OAuth keys (P01)
