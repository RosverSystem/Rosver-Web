# Cambio: Audit log de logins (R06) + verificación de tooltips sidebar (R11)

**Fecha:** 2026-09-08
**Tipo:** feature

## Qué cambió

1. **R06 — Audit log de logins.** Nueva tabla `login_audit` (migración `009`) que registra cada intento de login (correo, IP, éxito/fallo, motivo) desde los tres puntos de decisión en `POST /api/auth/login` y `POST /api/auth/login/totp`: credenciales incorrectas, cuenta desactivada, código 2FA incorrecto, y login exitoso (con y sin 2FA). Nuevo endpoint `GET /api/admin/login-audit` (admin-only, últimos 50 por defecto, máx 500) y panel `LoginAuditPanel` embebido debajo de la tabla de usuarios en `/admin/usuarios`.
2. **R11 — Tooltips en sidebar colapsada.** Verificado: `AdminSidebar.tsx` ya pone `title={...}` en todos los enlaces/botones que quedan solo-ícono al colapsar (módulos sueltos, botón de grupo «Catálogo», los hijos del grupo como monograma, «Ver tienda», el botón de cuenta). No hizo falta ningún cambio de código — se documenta como cerrado tras confirmarlo leyendo el componente.

## Por qué

Recomendaciones R06 y R11 de la auditoría (0125), dentro de la pasada "realiza las recomendaciones" pedida explícitamente por el usuario (con R21 diferida, ver 0126).

## Cómo

- No se logea el caso de "requiere verificación de correo" ni "requiere 2FA" (no son un resultado final del intento, son un paso intermedio) — evita ruido en el log sin perder cobertura de los desenlaces reales.
- Inserción con `try/catch` que solo hace `console.warn` si falla (nunca debe romper el login por un problema de auditoría).
- Se probó insertando intentos reales contra la Postgres de Railway: un login fallido con credenciales inválidas quedó registrado con `reason: 'bad_credentials'`; un login exitoso con una cuenta de prueba quedó registrado con `success: true`. Ambas filas de prueba se borraron al cerrar, junto con la cuenta de prueba usada.
- El campo `ip` depende de `x-forwarded-for`/`cf-connecting-ip`; en local sin proxy queda `"unknown"` (esperado); en Railway detrás de proxy debería verse la IP real.

## Archivos

- `RosverSac/server/sql/009_login_audit.sql` (nuevo)
- `RosverSac/server/src/lib/login-audit.ts` (nuevo)
- `RosverSac/server/src/routes/auth.ts` (registra intentos en `/login` y `/login/totp`)
- `RosverSac/server/src/routes/admin-users.ts` (`GET /login-audit`)
- `RosverSac/src/features/admin-users/ui/LoginAuditPanel.tsx` (nuevo)
- `RosverSac/src/features/admin-users/ui/AdminUsersPage.tsx` (monta el panel)
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run db:migrate` aplica `009_login_audit.sql` sin error.
- [x] `npm run typecheck:server`, `npm run lint`, `npm run build` sin errores.
- [x] Login fallido (credenciales inválidas) inserta una fila con `success:false, reason:'bad_credentials'`.
- [x] Login exitoso inserta una fila con `success:true`.
- [x] `GET /api/admin/login-audit` responde 200 con las filas más recientes primero, solo accesible como admin.
- [x] Sidebar colapsada: cada ícono (módulos, grupo Catálogo y sus hijos, Ver tienda, cuenta) tiene `title` con el nombre completo.
