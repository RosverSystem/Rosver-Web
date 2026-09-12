# Cambio: Contacto — animación envío + botón WhatsApp en correo

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Formulario de contacto: mini pantalla Motion (enviando → recibido → vuelve al form).
- Correo de confirmación: CTA WhatsApp verde con ícono PNG en R2 (`brand/whatsapp-mark.png`).
- Mensaje de contacto: contador 5–1000; avisos informativos (no error técnico de Zod).

## Por qué

La tarjeta estática de “mensaje enviado” se sentía pobre; el correo mostraba solo un link azul poco claro.

## Cómo

- `AnimatePresence` + fases `sending` / `sent` / `idle` en `ContactPage`.
- HTML de `sendContactConfirmationEmail` con botón `#25D366` + ícono público.

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/public/whatsapp-mark.svg`
- `docs/changes/0173-contacto-animacion-email-wa.md`

## Cómo verificar

- [ ] En `/contacto`, enviar mensaje: ver carga → éxito → formulario de nuevo
- [ ] Toast de éxito + correo con botón verde WhatsApp
- [ ] Clic del botón abre `wa.me/51980202591`
- [ ] Móvil / tablet / desktop OK
- [ ] Sin jank evidente en la animación
