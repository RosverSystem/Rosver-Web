# Cambio: Fix Redis WRONGPASS (usuario default)

**Fecha:** 2026-09-08  
**Tipo:** fix

## Qué cambió

- Causa: `REDIS_URL` usaba `redis://default:…@…` y Redis Railway (`redis:7-alpine` + `requirepass`) responde `WRONGPASS`.
- Código: `buildRedisUrl()` quita el user `default` si viene en la URL; armado sin username si se construye por piezas.
- Cliente Redis: corta reconnect spam tras errores de auth.
- Railway: `REDIS_URL` del servicio web → `redis://:${{Redis.REDISPASSWORD}}@${{Redis.RAILWAY_PRIVATE_DOMAIN}}:6379`.
- Doc `08` actualizada.

## Por qué

Logs de producción llenos de `[redis] WRONGPASS invalid username-password pair or user is disabled.`

## Archivos

- `RosverSac/server/src/config.ts`
- `RosverSac/server/src/lib/redis.ts`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0138-fix-redis-wrongpass.md`

## Cómo verificar

- [ ] Tras redeploy, logs sin spam WRONGPASS
- [ ] `/api/health` → `redis.status` conectado (o al menos sin error de auth)
