# Cambio: Auth OTP autenticador, passwordless, pending 24h

**Fecha:** 2026-09-09  
**Tipo:** feature  
**Versión:** 0.1.43

## Qué cambió

- Login: email+password; botón celular (junto a Google) = sin contraseña → TOTP o OTP correo.
- Registro → tabla `pending_registrations` (24 h); verify mueve a `users`; purge periódico.
- Login con cuenta no verificada → modal blur + verificación obligatoria.
- Recuperación: autenticador primero (si vinculado) → OTP correo; 3 intentos/código; reenvío.
- Perfil cliente: vincular / desvincular autenticador (desvincular pide código de la app).
- Eliminado Facebook del login/registro.
- Migración `012_pending_registrations.sql`. Bugfix: `verifyTotpCode` ahora se `await`.

## Por qué

Pedido de flujo OTP/authenticator, passwordless, verificación obligatoria con TTL y recuperación alineada.

## Cómo

- API: `/login/otp`, `/reset-password/start`, `/reset-password/totp`; `/2fa/disable` solo con TOTP.
- UI: toggle passwordless, `VerificationRequiredModal`, sección 2FA en perfil.
- Cleanup: `startPendingRegistrationCleanup` cada 15 min en boot API.

## Archivos

- `RosverSac/server/sql/012_pending_registrations.sql`
- `RosverSac/server/src/routes/auth.ts`
- `RosverSac/server/src/lib/otp.ts`, `pending-registrations.ts`, `validation.ts`
- `RosverSac/server/src/index.ts`
- `RosverSac/src/features/auth/**` (Login, Register, Reset, Otp, Modal, context)
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `docs/features/auth.md`, `docs/logica-y-flujos/01-auth-sesion-roles.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Registro → OTP → cuenta en `users`; sin verificar 24 h se purga de `pending_registrations`
- [ ] Login no verificado → modal blur + OTP
- [ ] Login verificado sin 2FA → OTP correo; con 2FA → autenticador
- [ ] Login «Sin contraseña» (cliente/admin) → mismo segundo factor
- [ ] `/cuenta/perfil` vincular QR Google/Microsoft; desvincular pide código app
- [ ] `/recuperar` con 2FA → TOTP luego OTP correo
- [ ] No hay botón Facebook en login/registro
- [ ] Móvil / tablet / desktop en login, registro, perfil 2FA
