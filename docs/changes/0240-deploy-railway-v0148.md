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

- [ ] `https://rosver-web-production.up.railway.app/api/health` → `ok: true`
- [ ] `commitSha` coherente con HEAD de `main`
- [ ] SPA `/catalogo` y `/admin` sin 404
- [ ] Migraciones 040–042 aplicadas en boot (leads/content/promos)
