# Cambio: Contacto — diseño con más presencia de marca

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Hero con acento rojo + título “Contacto Rosver”.
- Panel split: izquierda ink (datos + visual CSS + WhatsApp/cotizar), derecha form blanco.
- CTA enviar en rojo Rosver; focus de inputs con acento rojo suave.
- Visual “combo” geométrico liviano (sin bitmap).
- Sigue siendo un solo bloque (sin cards sueltas).

## Por qué

La versión anterior quedó demasiado plana/gris y poco Rosver.

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/features/contact.md`
- `docs/changes/0068-contacto-diseno-marca.md`

## Cómo verificar

- [ ] `/contacto`: panel ink + form alineados
- [ ] WhatsApp / cotizar / enviar funcionan
- [ ] Móvil: ink arriba, form abajo
- [ ] Sin assets pesados
