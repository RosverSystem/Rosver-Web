# Cambio: Presentaciones del catálogo + oferta con fechas

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- En ficha producto (fase Precios): se elige una **presentación ya guardada** (Presentaciones) y solo se pide precio de venta / mayorista.
- Ofertas con **ventana de vigencia** (`valid_from` / `valid_to`): inicio y fin opcionales; vacío = siempre activa.
- Tienda solo muestra la oferta si está dentro de la ventana (o sin fechas).
- Endpoint `GET /api/admin/presentations` (cantidades del catálogo; si un tipo no tiene cantidades, ofrece `× 1`).
- Migración `031_product_price_validity.sql`.

## Por qué

Evitar recrear tipo/cantidad en cada producto y poder programar descuentos por tiempo limitado.

## Cómo

- Packaging del producto se crea desde la plantilla (unit_type + content_qty).
- `product_prices` guarda vigencia; catálogo filtra ofertas con `now()` entre from/to.
- UI: `datetime-local` para inicio/fin; listado muestra el rango.

## Archivos

- `RosverSac/server/sql/031_product_price_validity.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/server/src/lib/catalog-products.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminProductWorkspacePage.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API para aplicar migración `031`
- [ ] Tener al menos una presentación en `/admin/listado-precios`
- [ ] En producto → Precios: el select muestra presentaciones; agregar solo con precio
- [ ] Oferta con inicio/fin: fuera de ventana no aparece en tienda; dentro sí
- [ ] Oferta sin fechas: se muestra siempre (si `is_active`)
- [ ] _(UI)_ Móvil / tablet / desktop: form de precios usable
