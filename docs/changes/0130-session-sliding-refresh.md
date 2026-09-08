# Cambio: Expiración deslizante de sesión (R02)

**Fecha:** 2026-09-08
**Tipo:** feature

## Qué cambió

Antes, una sesión duraba exactamente `SESSION_DAYS` (14 días por defecto) desde el login, sin importar qué tan activo estuviera el usuario — pasado ese plazo, se desloguea aunque haya usado la app todos los días. Ahora `resolveSessionUser` (llamado en cada request autenticado vía `requireAuth`) revisa cuánto le queda a la sesión: si le queda **menos de la mitad** de su ventana (`SESSION_DAYS`), la extiende — `expires_at` en la fila de `sessions` y el `Set-Cookie` de la respuesta — a `now() + SESSION_DAYS` de nuevo. Si le queda más de la mitad, no toca nada (evita escrituras y `Set-Cookie` innecesarios en cada request).

No se implementó rotación del **valor** del token en cada request (cambiar el token en sí, no solo su expiración): es más invasivo y con más riesgo de condiciones de carrera entre pestañas/requests concurrentes del mismo usuario, por un beneficio de seguridad marginal frente a la expiración deslizante. Queda anotado como posible mejora futura si se necesita, no como parte de este cambio.

## Por qué

Recomendación R02 de la auditoría (0125): "Seguridad sesiones largas" — con una sesión de duración fija, un usuario activo termina deslogueado sin aviso justo cuando más la está usando, lo cual empuja a sesiones más largas (peor si se filtra un token) en vez de mantenerlas cortas pero renovadas por uso real.

## Cómo

- Columna nueva `sessions.last_seen_at` (migración `010`, nullable, se llena solo cuando efectivamente se extiende — no en cada request, para no escribir en cada hit).
- Umbral de "menos de la mitad de vida útil" en vez de "renovar siempre" o "renovar cerca del vencimiento": balance entre no perder al usuario a mitad de sesión y no reescribir la fila de `sessions` (ni reenviar `Set-Cookie`) en cada request.
- Probado directo contra la Postgres de Railway con dos sesiones de prueba insertadas a mano (mismo hash sha256 que usa el código real) sobre un usuario descartable: una con 1h de vida restante (de 14 días) → `GET /api/auth/me` devolvió `Set-Cookie` con expiración extendida ~14 días y la fila en DB quedó con `expires_at`/`last_seen_at` actualizados; otra con 13 días restantes (más de la mitad) → mismo endpoint, sin `Set-Cookie` en la respuesta (confirma que no toca sesiones que no lo necesitan). Usuario y sesiones de prueba borrados al cerrar.

## Archivos

- `RosverSac/server/sql/010_session_refresh.sql` (nuevo)
- `RosverSac/server/src/lib/session.ts` (`resolveSessionUser`)
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run db:migrate` aplica `010_session_refresh.sql` sin error.
- [x] `npm run typecheck:server`, `npm run lint`, `npm run build` sin errores.
- [x] Sesión con <50% de vida útil restante: `GET /api/auth/me` devuelve `Set-Cookie` con nueva expiración; `sessions.expires_at`/`last_seen_at` se actualizan en DB.
- [x] Sesión con >50% de vida útil restante: mismo endpoint, sin `Set-Cookie` (no se toca).
