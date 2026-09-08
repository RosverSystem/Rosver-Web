# Cambio: PDF cotización estilo factura + pie web/QR

**Fecha:** 2026-09-08  
**Tipo:** fix  
**Versión:** 0.1.42

## Qué cambió

- El PDF de cotización vuelve al layout tipo factura impresa Rosver (referencia del comprobante): logo + dirección, caja RUC/COTIZACIÓN/N°, datos en 2 columnas, tabla IT/CANT/UND/DESCRIPCIÓN/precios con líneas verticales, `SON:` en letras, grilla de totales (OP. GRABADA / IGV / PRECIO TOTAL…).
- Se mantiene el pie pedido antes: «¡Visítanos en la web!» + URL + QR a `/cotizar?ref=…`.
- Aviso: no es comprobante SUNAT.

## Por qué

El rediseño “comercial” (0136) se apartó del estilo de factura que el usuario quiere; pidió igualar esa plantilla y conservar el pie.

## Archivos

- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `RosverSac/package.json`
- `docs/changes/0140-cotizacion-pdf-estilo-factura.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Carrito → Continuar pedido → Descargar PDF
- [ ] Cabecera como factura (logo, dirección, caja COTIZACIÓN)
- [ ] Tabla con columnas y totales tipo factura + SON:
- [ ] Pie con visita web + QR que abre `/cotizar?ref=…`
- [ ] Móvil / tablet / desktop: descarga desde el modal usable
