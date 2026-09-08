# Cambio: Fix deploy Railway EBUSY + commit correcto

**Fecha:** 2026-09-08  
**Tipo:** fix

## Qué cambió

- Diagnóstico: builds FALLIDOS en Railway por `EBUSY` al hacer `npm ci` sobre el mount `node_modules/.cache`.
- Los redeploys vía GraphQL sin `commitSha` estaban reconstruiendo un commit viejo (`70ecd881`), no el `main` actual.
- `nixpacks.toml`: fase `build` solo `npm run build` (sin segundo `npm ci`) + `NIXPACKS_NO_CACHE=1`.
- `railway.toml`: `startCommand` → `npx tsx server/src/boot.ts`.
- Redeploy forzado con `commitSha` del HEAD de `main`.

## Por qué

El usuario veía errores en Railway; la app antigua seguía viva (`/api/health` OK) pero los nuevos deploys fallaban.

## Archivos

- `RosverSac/nixpacks.toml`
- `RosverSac/railway.toml`
- `docs/changes/0137-fix-railway-ebusy-deploy.md`

## Cómo verificar

- [ ] Deploy Railway status SUCCESS con commit del fix
- [ ] `GET /api/health` → ok
- [ ] SPA y `/cotizar` responden
