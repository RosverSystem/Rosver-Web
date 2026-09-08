# Cambio: Rate limiter de login sobre Redis (R18)

**Fecha:** 2026-09-08
**Tipo:** refactor

## Qué cambió

`server/src/lib/rate-limit.ts` ahora usa Redis (ventana fija con `INCR`+`PEXPIRE` y una key de bloqueo con `PX`) cuando `REDIS_URL` está configurado, para que el límite de intentos de login sea compartido entre instancias del API. Si Redis no está configurado o falla en cualquier operación, se degrada automáticamente al contador en memoria que ya existía (mismo comportamiento que antes, por proceso) — mismo patrón de degradación que ya usa el caché de catálogo (`lib/redis.ts`).

La API pública de `loginLimiter` (`check`/`recordFailure`/`recordSuccess`) pasó a ser async (antes era síncrona sobre el Map en memoria); se actualizó el único caller (`POST /api/auth/login` en `auth.ts`) para `await` las tres llamadas.

## Por qué

Recomendación R18 de la auditoría (0125): el límite actual era por proceso, así que si el API llegara a correr en más de una instancia (ej. Railway con réplicas), cada instancia tendría su propio contador y el límite real efectivo se multiplicaría por el número de instancias.

## Cómo

- Se agregó `getRedisClient()` (export) en `lib/redis.ts` para reusar la misma conexión ioredis ya gestionada ahí (lazy, con degradación si `REDIS_URL` no está seteado) en vez de abrir una conexión aparte.
- Ventana fija (no deslizante) por simplicidad: `INCR` de un contador con `PEXPIRE` en el primer fallo de la ventana; al llegar al máximo se setea una key de bloqueo separada con `PX` = duración del bloqueo. Es más simple que una ventana deslizante real y suficiente para frenar fuerza bruta (mismos umbrales que antes: 5 fallos/10min por email, 20 fallos/10min por IP, bloqueo 5min).
- Se probó en este entorno (Redis deshabilitado — `redisStatus()` confirma `configured:false`), así que lo que se ejercitó en vivo fue la ruta de fallback en memoria: 6 intentos fallidos seguidos contra un correo inexistente devolvieron 401 x5 y luego 429 con `retryAfterSec`, igual que antes del cambio. La ruta Redis no se pudo probar en vivo en este entorno (no hay `REDIS_URL` local), pero el código comparte el mismo cliente y patrón try/catch-degradado ya verificado en `lib/redis.ts` para el caché de catálogo.

## Archivos

- `RosverSac/server/src/lib/rate-limit.ts`
- `RosverSac/server/src/lib/redis.ts` (nuevo export `getRedisClient`)
- `RosverSac/server/src/routes/auth.ts` (await en las 3 llamadas a `loginLimiter`)
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run typecheck:server`, `npm run lint`, `npm run build` sin errores.
- [x] 6 intentos de login fallidos seguidos contra un correo inexistente → los primeros 5 devuelven 401, el 6º devuelve 429 con `retryAfterSec`.
- [ ] _(No probado en este entorno — no hay `REDIS_URL` local)_ Con Redis configurado, dos instancias del API comparten el mismo contador de bloqueo.
