# Cambio: Rediseño vista Contacto

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `ContactPage`: banner Memphis Rosver, layout 2 columnas (info + formulario), Motion, estado éxito mejorado.
- Cards: WhatsApp/teléfono, comercial, ubicación + CTA a cotizar.
- Formulario con labels accesibles; WhatsApp verde marca.
- Sin mapas/imágenes pesadas (regla assets).

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/features/contact.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0058-rediseno-contacto.md`

## Cómo verificar

- [ ] `/contacto`: banner + columnas info/form
- [ ] Enviar mensaje → estado éxito; “Enviar otro”
- [ ] WhatsApp abre `wa.me`
- [ ] Móvil apila columnas; tablet/desktop 2 cols
- [ ] Carga liviana (CSS/SVG, sin bitmap)
