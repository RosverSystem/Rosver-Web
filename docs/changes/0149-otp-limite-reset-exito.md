# Cambio: OTP — límite se reinicia al entrar bien

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- El tope de envíos OTP (4 / 30 min) **solo aplica si no completas el acceso**.
- Si el código es correcto (login / verify / reset), se **borra el historial** de ese purpose → el límite vuelve a cero.
- Login con autenticador (TOTP) también limpia el historial de OTP correo `login`.
- Mensaje de límite más claro.
- Se limpió el historial bloqueado de la cuenta de prueba local.

## Por qué

Salir y volver a entrar varias veces (u otra PC) no debería dejar sin códigos; el tope es anti-abuso cuando pides códigos sin completar.

## Archivos

- `RosverSac/server/src/lib/otp.ts`
- `RosverSac/server/src/routes/auth.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Pedir OTP, entrar con código correcto → volver a pedir OTP (tras cooldown 30s) sin toast de límite
- [ ] Pedir 4 códigos sin usarlos → límite; tras 30 min o éxito, se libera
- [ ] Bloqueo por contraseña incorrecta (día) sigue aparte
