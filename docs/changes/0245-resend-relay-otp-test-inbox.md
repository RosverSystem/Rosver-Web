# Cambio: Resend relay OTP cuando Free bloquea destinatario

**Fecha:** 2026-09-12  
**Tipo:** fix

## Qué cambió

- Si Resend responde 403 (solo email de la cuenta), reenvía el OTP a `RESEND_TEST_TO` (`rosver1103@gmail.com`) con aviso del destinatario original.
- Así login con `acosta.wp076@gmail.com` deja de mostrar “No pudimos enviar el correo”.
- `mailDelivered: true` cuando el relay OK.

## Limitación

Hasta verificar dominio en Resend, el código llega a **rosver1103@gmail.com** (no a acosta). El código sigue siendo válido para entrar como acosta.

## Cómo verificar

- [ ] Login acosta → sin toast de error; OTP en rosver1103
- [ ] Login rosver1103 → OTP directo
