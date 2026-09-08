# Cambio: Continuar pedido — modal PDF + WhatsApp

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.31

## Qué cambió

- «Continuar pedido» abre modal (datos negocio + ítems del carrito).
- **Descargar PDF** cotización estilo factura Rosver (`jspdf` + QR).
- **Continuar por WhatsApp**: descarga el PDF y abre `wa.me` con resumen (WA no permite adjuntar PDF por URL).
- Datos empresa en `shared/lib/company.ts`; WhatsApp actualizado a 963986002.

## Por qué

Pedido: al continuar, poder bajar la cotización con plantilla tipo factura o seguir por WhatsApp.

## Cómo

`buildQuotePdf` arma A4; modal valida nombre/teléfono con toasts; IGV 18% desglosado asumiendo precios inc. IGV.

## Archivos

- `RosverSac/package.json` (+ `jspdf`)
- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `RosverSac/src/shared/lib/company.ts`
- `RosverSac/src/shared/lib/number-to-words-es.ts`
- `RosverSac/src/shared/lib/contact.ts`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/logica-y-flujos/07-carrito.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Carrito con ítems → Continuar pedido → modal
- [ ] Descargar PDF: cabecera Rosver, tabla, SON:, totales, QR
- [ ] WhatsApp: descarga PDF + abre chat con resumen
- [ ] Validación sin nombre/teléfono → toasts
- [ ] Móvil: modal bottom-sheet usable
- [ ] Deploy Railway v0.1.31
