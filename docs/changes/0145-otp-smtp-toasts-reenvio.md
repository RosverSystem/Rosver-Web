# Cambio: OTP correo real + toasts + límite de reenvíos

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- SMTP local: puerto **587 STARTTLS** (465 hacía `ETIMEDOUT` en esta red); fallback 587 si el primario 465 falla.
- Textos de OTP: sin “Máximo 3 intentos” en copy; fallos/éxitos por **toasts flotantes** (“Intento fallido…”, correo no enviado, reenviado, etc.).
- Reenvío: **cooldown 30 s** en UI + API; tope **4 envíos / 30 min** (1 inicial + 3 reenvíos).
- `OtpVerifyPanel`, login, registro, reset y modal de verificación alineados al meta `mailDelivered` / `retryAfterSec`.
- `ApiError` guarda el `payload` JSON (p. ej. `retryAfterSec` en 429).

## Por qué

El OTP no llegaba al correo (timeout a Hostinger `:465`). La UI mostraba reglas de intentos en texto fijo en lugar de toasts. Faltaba descanso y tope claros en “Reenviar código”.

## Cómo

- `mail.ts`: timeouts + fallback STARTTLS 587.
- `otp.ts`: cooldown 30s + `OTP_MAX_SENDS=4` en ventana de 30 min; mensajes de verify cortos para toast.
- UI: countdown en botón reenviar; toasts vía `useFormToasts`.

## Archivos

- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/server/src/lib/otp.ts`
- `RosverSac/server/src/routes/auth.ts` (meta ya expuesto)
- `RosverSac/src/shared/lib/api.ts`
- `RosverSac/src/features/auth/model/auth-context.tsx`
- `RosverSac/src/features/auth/ui/OtpVerifyPanel.tsx`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/src/features/auth/ui/ResetPasswordPage.tsx`
- `RosverSac/src/features/auth/ui/VerificationRequiredModal.tsx`
- `RosverSac/.env` (local, no commit): `SMTP_PORT=587`, `SMTP_SECURE=false`
- `docs/pendientes/PENDIENTES.md`, `RECOMENDACIONES.md`

## Cómo verificar

- [ ] API reiniciada con `.env` en 587; login sin contraseña → toast “Código enviado…” y correo en bandeja/spam
- [ ] Código incorrecto → toast “Intento fallido…” (sin texto de máximo intentos en pantalla)
- [ ] Reenviar: botón `Reenviar código (30s)`…; tras 3 reenvíos → toast de límite
- [ ] Móvil / tablet / desktop: panel OTP usable, toasts visibles
- [ ] Railway: variables SMTP en 587 si 465 también bloquea (pendiente deploy)
