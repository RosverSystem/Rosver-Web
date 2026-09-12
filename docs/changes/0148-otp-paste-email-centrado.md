# Cambio: OTP pegado sin espacios + email centrado

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Al pegar/escribir OTP se eliminan espacios y separadores (`normalizeOtpCode`) en login, registro, recuperar y 2FA.
- API también limpia el código al validar.
- Correo OTP: diseño centrado (cabecera roja, código sin espacios reales — solo letter-spacing —, CTA centrado, tipografía más clara).

## Por qué

Al copiar del mail llegaba `0 3 1 1 2 5` y fallaba la verificación; el botón del correo estaba a la izquierda.

## Archivos

- `RosverSac/src/shared/lib/otp-code.ts`
- `RosverSac/src/features/auth/ui/OtpVerifyPanel.tsx`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/ResetPasswordPage.tsx`
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/server/src/lib/otp.ts`
- `RosverSac/server/src/lib/validation.ts`
- `RosverSac/server/src/lib/totp.ts`

## Cómo verificar

- [ ] Copiar código del correo (con o sin espacios visuales) → pega como `031125` y entra
- [ ] Nuevo correo: logo, texto y botón **Ir a Rosver** centrados
- [ ] Móvil / tablet / desktop
