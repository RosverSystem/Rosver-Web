# Cambio: Cotizar guarda dirección/ubigeo/agencia + admin real

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Al enviar cotización por WhatsApp se persiste en `quote_requests`: dirección, dep/prov/dist, agencia, ítems, total.
- Toast confirma guardado en BD con dirección y agencia.
- Admin `/admin/cotizaciones` lee de Postgres (`GET /api/admin/quotes`), no mocks.
- Migración `021`: quita columnas ubigeo de agencia (solo nombre de agencia).

## Por qué

Los datos de destino y agencia del formulario deben quedar en la base (y verse en el ERP).

## Cómo

- `POST /api/quotes` inserta `ship_*` + `agency_name`.
- `GET /api/admin/quotes` (rol admin) lista últimas 200.

## Archivos

- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/server/src/index.ts`
- `RosverSac/server/sql/021_quote_drop_agency_ubigeo.sql`
- `RosverSac/src/features/quotes/ui/AdminQuotesPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`

## Cómo verificar

- [ ] `/cotizar`: completar dirección + ubigeo + agencia + producto → WhatsApp → toast “Guardado en base de datos”
- [ ] `/admin/cotizaciones`: aparece la fila con dirección, distrito/provincia/depto y agencia
- [ ] Móvil / tablet / desktop
