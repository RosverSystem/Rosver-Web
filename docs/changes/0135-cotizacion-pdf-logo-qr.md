# Cambio: PDF cotización con logo, pie web y QR personalizado

**Fecha:** 2026-09-08  
**Tipo:** feature | fix

## Qué cambió

- El PDF de cotización usa el logo real `public/logo_sinfondo.png`.
- Pie con invitación «¡Visítanos en la web!» + URL del catálogo.
- QR funcional único por documento: abre `/cotizar?ref=<número>` en la web.
- En `/cotizar` se muestra un aviso si llegas con `?ref=` (escaneo del QR).

## Por qué

El PDF se veía genérico (texto “ROSVER” sin marca) y el QR no era útil ni personalizado.

## Archivos

- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `docs/changes/0135-cotizacion-pdf-logo-qr.md`

## Cómo verificar

- [ ] Continuar pedido → Descargar PDF: logo visible arriba a la izquierda
- [ ] Pie con “Visítanos en la web” + URL
- [ ] Escanear QR → abre `/cotizar?ref=C001-…` y muestra el aviso de referencia
- [ ] _(UI)_ PDF legible; página cotizar OK en móvil
