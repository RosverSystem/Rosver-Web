# Cambio: Fix build Railway (Node 22 + sin doble npm ci)

**Fecha:** 2026-09-08  
**Tipo:** fix | chore

## Qué cambió

- Diagnóstico del deploy fallido: Nixpacks usaba **Node 18** (Vite 8 / RR7 requieren ≥20) y el `buildCommand` con segundo `npm ci` chocaba con el cache mount → `EBUSY` en `/app/node_modules/.cache`.
- `RosverSac/railway.toml`: `buildCommand = "npm run build"` (sin `npm ci`).
- `RosverSac/nixpacks.toml`: Node 22.
- `package.json`: `engines.node >= 20.19.0`.
- Railway servicio `Rosver-Web`: root `RosverSac`, build/start actualizados, var `NIXPACKS_NODE_VERSION=22`.
- Token workspace guardado en `.env` (gitignored). Docs `08` actualizados con IDs del proyecto.

## Por qué

Sin Node moderno y sin el doble `npm ci`, el build en Railway no termina; la SPA no sale a producción.

## Cómo

Corregir config en repo + mutation GraphQL `serviceInstanceUpdate` / `variableCollectionUpsert` con el token workspace. Redeploy tras push a `main`.

## Archivos

- `RosverSac/railway.toml`
- `RosverSac/nixpacks.toml`
- `RosverSac/package.json`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0088-fix-build-railway-node-cache.md`

## Cómo verificar

- [x] Push a `main` (`3a74059`) con fix de build
- [x] Redeploy `Rosver-Web` → status `SUCCESS` (buildCommand `npm run build` + Node 22)
- [x] URL https://rosver-web-production.up.railway.app → 200, título `Rosver SAC`
- [x] `/catalogo` → 200 (SPA fallback)
- [ ] En dashboard: borrar servicios basura `humorous-enchantment` y vacío `web` si no se usan
- [ ] Postgres: confirmar health / `DATABASE_URL` en dashboard
