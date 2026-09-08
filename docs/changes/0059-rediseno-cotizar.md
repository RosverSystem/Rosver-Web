# Cambio: Rediseño vista Cotizar

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `QuoteRequestPage`: banner Memphis Rosver, layout 2 columnas (beneficios + formulario), Motion, estado éxito.
- Beneficios: respuesta 24 h, sin cuenta, asesoría; CTA a `/carrito`.
- Formulario ampliado: ciudad, productos/cantidad, notas opcionales + WhatsApp verde.
- Sin bitmaps decorativos (CSS/SVG).

## Por qué

La vista `/cotizar` seguía como formulario mínimo; contacto/catálogo ya tenían el lenguaje visual Rosver.

## Cómo

Mismo patrón que `ContactPage`: banner + aside + card form; fase visual (submit → `sent` local).

## Archivos

- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `docs/features/quotes.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0059-rediseno-cotizar.md`

## Cómo verificar

- [ ] `/cotizar`: banner + columnas beneficios/form
- [ ] Enviar solicitud → estado éxito; “Enviar otra” / link catálogo
- [ ] “Ir al carrito” → `/carrito`; WhatsApp abre `wa.me`
- [ ] Móvil apila columnas; tablet/desktop 2 cols
- [ ] Carga liviana (CSS/SVG, sin bitmap)
