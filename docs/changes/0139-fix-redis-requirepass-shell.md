# Cambio: Fix Redis requirepass (startCommand shell)

**Fecha:** 2026-09-08  
**Tipo:** fix

## Qué cambió

- Causa residual del WRONGPASS: el servicio Redis arrancaba con  
  `redis-server --requirepass $REDISPASSWORD` **sin shell**, así que la variable no se expandía y el `requirepass` real no coincidía con `REDIS_URL` de la web.
- Railway Redis `startCommand` →  
  `sh -c 'redis-server --requirepass "$REDISPASSWORD" --bind 0.0.0.0 --port 6379'`.
- Código: `config.redis` con host/port/password explícitos para ioredis (evita rarezas de URL); cliente usa opciones en vez de solo URL.
- Redeploy Redis + web.

## Por qué

Tras quitar el user `default` (0138), los logs seguían con WRONGPASS: la contraseña del proceso Redis no era la de la variable.

## Archivos

- Railway Redis `startCommand` (dashboard / GraphQL)
- `RosverSac/server/src/config.ts`
- `RosverSac/server/src/lib/redis.ts`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0139-fix-redis-requirepass-shell.md`

## Cómo verificar

- [ ] Logs web sin spam `[redis] WRONGPASS`
- [ ] `GET /api/health` → `redis.configured: true` y `status` ≠ `disabled` (p. ej. `ready` / `connect`)
- [ ] Home destacados / trending siguen respondiendo (caché opcional)
