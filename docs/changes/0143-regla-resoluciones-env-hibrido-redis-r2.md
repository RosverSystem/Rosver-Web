# Cambio: Regla resoluciones + env híbrido Redis/R2

**Fecha:** 2026-09-09  
**Tipo:** docs | chore

## Qué cambió

- Regla responsive ampliada (Cursor + Claude): **todas las resoluciones**, incluyendo altura / laptops.
- `.env` local híbrido (gitignored): Postgres **local** + Redis Railway (TCP proxy) + Cloudflare R2 + SMTP desde Railway.
- Creado TCP proxy Redis: `iriguchi.proxy.rlwy.net:37761` → `:6379`.
- Documentado modo híbrido en `08` §1.2.
- Token Railway guardado en `.env` (GraphQL OK; CLI `whoami` con UUID sigue Unauthorized).

## Por qué

Seguir en local con DB propia, pero usar Redis y R2 reales de producción/cloud. El usuario pidió también sacar correo del env Railway.

## Cómo

- Variables vía GraphQL Railway (`variables` del servicio `Rosver-Web` + Redis).
- Verificado: `REDIS PONG`, `HeadBucket` R2 `rosver-public-media`, `/api/health` → `redis.status: ready`.

## Archivos

- `.cursor/rules/03-responsive-ui.mdc`
- `.claude/rules/03-responsive-ui.md`
- `RosverSac/.env` (local, no commit)
- `RosverSac/.env.example`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/pendientes/PENDIENTES.md`
- `docs/changes/0143-regla-resoluciones-env-hibrido-redis-r2.md`

## Cómo verificar

- [x] `GET /api/health` → `redis.configured: true`, `status: ready`
- [x] Node ping Redis proxy OK
- [x] R2 `HeadBucket` OK
- [ ] Login/OTP usa SMTP (si falla, degrada a consola — R19)
- [ ] Postgres sigue siendo `rosver_local` (no Railway)
