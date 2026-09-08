# Cambio: Historial de precios / auditoría en ERP (R12)

**Fecha:** 2026-09-08
**Tipo:** feature

## Qué cambió

Nueva tabla `price_audit` (migración `011`) que registra cada creación, edición o baja de un precio (`product_prices`): producto, precio, presentación, acción, monto anterior/nuevo, quién lo hizo y cuándo. Se engancha en los tres puntos donde `admin-catalog.ts` muta `product_prices` — `POST /products/:id/prices` (crear y editar) y `DELETE /products/:id/prices/:priceId` (baja lógica) — sin cambiar su comportamiento existente. Nuevo endpoint `GET /api/admin/products/:id/price-history` (admin-only) y panel `PriceHistoryPanel` debajo de la sección «Precios» en `/admin/listado-precios` al abrir un producto.

## Por qué

Recomendación R12 de la auditoría (0125): "Compliance / márgenes" — hoy si un precio cambia (o se sube el margen, o se hace una rebaja puntual) no queda registro de quién lo hizo ni cuál era el monto anterior; solo se ve el estado actual.

## Cómo

- Igual que `login-audit.ts`, la inserción del registro de auditoría está en `try/catch` que solo hace `console.warn` si falla — nunca debe romper el guardado real del precio.
- Para el caso de **edición**, se hace un `SELECT amount` del precio antes del `UPDATE` (dentro de la misma transacción) para poder registrar el monto anterior — el resto de la lógica de guardado no cambió.
- Se probó de punta a punta contra la Postgres de Railway: se creó un producto de prueba oculto (`visible:false`, nunca aparece en la tienda pública), se le agregó una presentación y un precio (S/ 100), se editó a S/ 120, y se dio de baja — el endpoint de historial devolvió las 3 filas en orden correcto (`deactivated` 120→null, `updated` 100→120, `created` null→100) con el correo del admin que hizo cada cambio. El producto de prueba se borró al cerrar (`ON DELETE CASCADE` en `products` se llevó también sus presentaciones, precios y filas de `price_audit` — verificado que no quedó ninguna huérfana).

## Archivos

- `RosverSac/server/sql/011_price_audit.sql` (nuevo)
- `RosverSac/server/src/lib/price-audit.ts` (nuevo)
- `RosverSac/server/src/routes/admin-catalog.ts` (registra cambios + `GET /products/:id/price-history`)
- `RosverSac/src/features/admin-catalog/ui/PriceHistoryPanel.tsx` (nuevo)
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx` (monta el panel)
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run db:migrate` aplica `011_price_audit.sql` sin error.
- [x] `npm run typecheck:server`, `npm run lint`, `npm run build` sin errores.
- [x] Crear precio → fila `created` con `newAmount` correcto.
- [x] Editar precio → fila `updated` con `oldAmount`/`newAmount` correctos.
- [x] Quitar precio (baja lógica) → fila `deactivated` con `oldAmount` correcto.
- [x] Borrar el producto borra en cascada sus filas de `price_audit` (sin huérfanas).
