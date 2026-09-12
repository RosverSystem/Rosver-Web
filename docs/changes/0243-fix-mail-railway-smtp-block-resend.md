# Cambio: OTP emergencia + Resend HTTPS (Railway bloquea SMTP)

**Fecha:** 2026-09-12  
**Tipo:** fix

## Qué cambió

- Prueba SMTP local Hostinger → **OK** (correo llegó a Gmail).
- Causa prod: Railway **Trial** bloquea outbound SMTP (465/587) → `ETIMEDOUT`.
- Código: soporte `RESEND_API_KEY` (API HTTPS) antes de SMTP en `mail.ts`.
- Script `issue-otp-direct.ts` + OTP de emergencia enviado por SMTP local.

## Por qué

Login en rosversac.com no entregaba OTP aunque Hostinger fuera válido.

## Cómo verificar

- [x] Correo de prueba SMTP local recibido
- [x] OTP `082287` emitido en DB prod + enviado por mail local
- [ ] Rosa entra en `/login` con ese código (15 min)
- [ ] Añadir `RESEND_API_KEY` en Railway **o** subir plan Pro + redeploy para SMTP Hostinger
