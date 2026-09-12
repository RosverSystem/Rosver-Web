# Cambio: WhatsApp dual + redes oficiales

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Atención WhatsApp rota en **secuencia** entre `+51 980 202 591` y `+51 960 106 901` (localStorage) en botón flotante, footer, contacto, cotizar, carrito, ficha y ofertas.
- Redes: [Facebook](https://www.facebook.com/ROSVERSAC/), [TikTok](https://www.tiktok.com/@rosver.sac), Instagram `https://www.instagram.com/rosver.sac/` (mismo handle que TikTok).
- Teléfonos en PDF/empresa actualizados a esos dos números.

## Por qué

Repartir cotizaciones/atención entre dos líneas y completar links de redes que estaban en `#`.

## Cómo

`buildWhatsAppLink()` / `pickWhatsAppNumber()` en `shared/lib/contact.ts`; `SOCIAL_LINKS` en `social.ts`.

## Archivos

- `RosverSac/src/shared/lib/contact.ts`
- `RosverSac/src/shared/lib/social.ts`
- `RosverSac/src/shared/lib/company.ts`
- `RosverSac/src/shared/lib/index.ts`
- Footer, WhatsApp flotante, contacto, cotizar, carrito, ProductPage, OfferCard
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Clic 1 en WhatsApp flotante → un número; clic 2 → el otro
- [ ] Cotizar / Continuar pedido abren wa.me rotando
- [ ] Footer: Facebook / TikTok / Instagram abren perfiles reales
- [ ] Footer muestra ambos teléfonos
- [ ] Confirmar URL Instagram si no es `@rosver.sac`
