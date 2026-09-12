# Cambio: PDF cotización vs pedido (título distinto)

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- El generador de PDF acepta `kind: 'quote' | 'order'`.
- Cotizar → caja **COTIZACIÓN** + archivo `Cotizacion-Rosver-…pdf` (tabla `quote_requests`, códigos `QT-…`, link `/c/…`).
- Continuar pedido → caja **PEDIDO** + archivo `Pedido-Rosver-…pdf` (tabla `order_requests`, códigos `PD-…`, link `/p/…`).
- Pie del PDF: “tu cotización” / “tu pedido” según el tipo.

## Por qué

Los pedidos salían con título COTIZACIÓN aunque ya vivían en otra tabla.

## Cómo

Un solo builder (`quote-pdf.ts`) con etiqueta/filename según `kind`; las tablas ya estaban separadas (`018` quotes / `023` orders).

## Archivos

- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`

## Cómo verificar

- [ ] `/cotizar` → PDF dice COTIZACIÓN + QT-…
- [ ] Carrito → Continuar pedido → PDF dice PEDIDO + PD-…
- [ ] Admin cotizaciones vs pedidos siguen en tablas distintas
