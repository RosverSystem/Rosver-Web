# Cambio: Fix SMTP Hostinger en Railway (OTP)

**Fecha:** 2026-09-12  
**Tipo:** fix

## Qué cambió

- Railway SMTP: `465/SSL` → `587/STARTTLS` (igual que local; 465 hacía `ETIMEDOUT`).
- Password SMTP sincronizada (antes en Railway tenía 10 chars; local 11).
- `mail.ts`: fuerza IPv4 (`family: 4`) para evitar `ENETUNREACH` en AAAA de Cloudflare al fallback 587.

## Por qué

Login OTP mostraba aviso “No pudimos enviar el correo” pese a credenciales Hostinger presentes.

## Cómo verificar

- [ ] Reenviar código en https://rosversac.com/login
- [ ] Correo llega a Gmail (o spam)
- [ ] Logs Railway sin `ETIMEDOUT` / `ENETUNREACH`
