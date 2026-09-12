# Cambio: Resend en Railway + plantillas mail premium

**Fecha:** 2026-09-12  
**Tipo:** feature | fix

## Qué cambió

- `RESEND_API_KEY` + `RESEND_FROM=Rosver SAC <onboarding@resend.dev>` en Railway y `.env` local.
- Todos los envíos pasan primero por Resend HTTPS (sin fallback SMTP si hay key).
- Plantillas OTP y contacto rediseñadas (fondo ink, borde degradado, dígitos, motion CSS en clientes WebKit).
- Admins: `rosver1103@gmail.com` + `acosta.wp076@gmail.com`.

## Limitación temporal Resend

Sin dominio verificado, Resend **solo** entrega a `rosver1103@gmail.com`.  
Para OTP a cualquier correo → verificar dominio en [resend.com/domains](https://resend.com/domains).

## Cómo verificar

- [x] Envío Resend a rosver1103@gmail.com OK (diseño nuevo)
- [ ] Login prod con `rosver1103@gmail.com` + OTP del correo
- [ ] Tras verificar dominio: OTP a acosta y clientes
