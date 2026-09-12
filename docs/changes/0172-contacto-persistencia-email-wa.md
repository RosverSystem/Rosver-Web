# Cambio: Contacto — WhatsApp fijo + persistencia + email confirmación

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- WhatsApp en `/contacto`: mensaje de cotización Rosver; **siempre** `+51 980 202 591` (sin rotar).
- Formulario «Enviar mensaje» guarda en Postgres (`contact_messages`, código `CT-YYYY-######`).
- Correo de confirmación profesional al cliente (logo, nº de solicitud, resumen).
- Toast de éxito al enviar (+ aviso si el SMTP no entregó el correo).

## Por qué

Pedido: mensaje WA de cotización, número fijo 980, guardar leads y confirmar por email.

## Cómo

- Migración `017_contact_messages.sql`
- `POST /api/contact` + `sendContactConfirmationEmail`
- `buildFixedWhatsAppLink` + `CONTACT_WHATSAPP_MESSAGE`

## Archivos

- `RosverSac/server/sql/017_contact_messages.sql`
- `RosverSac/server/src/routes/contact.ts`
- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/server/src/index.ts`
- `RosverSac/src/shared/lib/contact.ts`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/features/contact.md`
- `docs/changes/0172-contacto-persistencia-email-wa.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Contacto → WhatsApp abre chat con 980 202 591 y texto de cotizar
- [ ] Enviar formulario con correo válido → toast éxito + fila en `contact_messages`
- [ ] Correo de confirmación llega (si SMTP OK)
- [ ] Sin correo → error de validación
- [ ] Móvil / tablet / desktop OK
