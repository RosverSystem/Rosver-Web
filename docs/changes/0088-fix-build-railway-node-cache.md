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

- [ ] Push a `main` dispara (o se fuerza) redeploy del servicio `Rosver-Web`
- [ ] Build logs: Node ≥20 y `npm run build` OK (sin `EBUSY`)
- [ ] Deployment status `SUCCESS`
- [ ] URL pública responde 200 en `/` y rutas SPA (ej. `/catalogo`)
- [ ] Postgres: si sigue FAILED, revisar volumen / plan en dashboard
