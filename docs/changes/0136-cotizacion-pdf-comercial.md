# Cambio: PDF cotización comercial (no factura)

**Fecha:** 2026-09-08  
**Tipo:** fix | feature

## Qué cambió

- El PDF deja de imitar una factura SUNAT (caja RUC, OP. GRAVADA, IGV, “SON: … SOLES”, grilla fiscal).
- Diseño de **cotización comercial**: logo, título COTIZACIÓN, N.º `COT-…`, destinatario, lista de productos, **total estimado** único.
- Se mantienen pie «Visítanos en la web» + QR personalizado a `/cotizar?ref=…`.
- Nota explícita: no es boleta/factura/comprobante.

## Por qué

Pedido del usuario: la cotización no debe parecer factura.

## Archivos

- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `docs/changes/0136-cotizacion-pdf-comercial.md`

## Cómo verificar

- [ ] Continuar pedido → PDF: título COTIZACIÓN, sin desglose IGV/OP. GRAVADA
- [ ] Logo + pie web + QR siguen presentes
- [ ] QR abre `/cotizar?ref=COT-…`
