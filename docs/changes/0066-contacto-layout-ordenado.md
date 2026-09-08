# Cambio: Contacto — layout más ordenado

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Un solo panel (canales + formulario) en lugar de 4 cards sueltas + form.
- Banner simple (sin Memphis ruidoso).
- Iconos ink/soft; CTA enviar ink→hover rojo; WhatsApp una sola vez a la izquierda.
- Link “volumen → cotizar” secundario, sin card negra.
- Nombre + canal en 2 cols en tablet+.

## Por qué

La vista se veía desordenada (cards desalineadas, mucho rojo, huecos).

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/features/contact.md`
- `docs/changes/0066-contacto-layout-ordenado.md`

## Cómo verificar

- [ ] `/contacto`: un bloque continuo; canales | form en desktop
- [ ] Móvil: canales arriba, form abajo
- [ ] Enviar → éxito; WhatsApp abre `wa.me`
- [ ] Poco rojo (solo hover del submit)
