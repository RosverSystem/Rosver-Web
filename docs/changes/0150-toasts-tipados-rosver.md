# Cambio: toasts tipados (éxito / error / info / aviso)

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Toasts con 4 tones Rosver: success (verde), error (rojo), info (azul), warning (amarillo).
- UI con icono + título + mensaje + cerrar (estilo referencia, paleta Rosver).
- `showSuccess` / `showErrors` / `showInfo` / `showWarning`; `showMessages` auto-infiere tone.
- Regla `10-form-toasts` actualizada (Cursor + Claude).
- Auth OTP/reset usan success/warning explícitos.

## Por qué

Antes todos los avisos parecían error (rojo). Hace falta distinguir éxito vs fallo en toda la web.

## Archivos

- `RosverSac/src/shared/ui/floating-toasts.tsx`
- `RosverSac/src/shared/ui/floating-toasts.types.ts`
- `RosverSac/src/shared/hooks/use-form-toasts.ts`
- `.cursor/rules/10-form-toasts.mdc`
- `.claude/rules/10-form-toasts.md`
- Auth OTP / reset pages

## Cómo verificar

- [ ] Reenviar OTP → toast verde «Éxito»
- [ ] Código incorrecto → toast rojo «Error»
- [ ] Correo no enviado → toast amarillo «Aviso»
- [ ] Admin guardar producto → verde (inferencia o showSuccess)
- [ ] Móvil / tablet / desktop
