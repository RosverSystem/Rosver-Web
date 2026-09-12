# Cambio: Cotizar — ubigeo Perú + persistencia

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- `/cotizar`: reemplazó «Ciudad o agencia» por **dirección** (dep/prov/dist + dirección) y **agencia** (nombre + dep/prov/dist).
- API ubigeo: `GET /api/peru/departments|provinces|districts` con datos oficiales Perú (`server/data/ubigeo/`).
- `POST /api/quotes` + migración `018_quote_requests.sql` guarda la solicitud en Postgres.
- Al enviar, abre WhatsApp con la constancia y el detalle de ubicación.

## Por qué

Se necesitaba ubigeo real de Perú y separar entrega vs agencia de transporte, persistido en DB.

## Cómo

- Cascada `PeruUbigeoFields` + `SelectCombobox`.
- Catálogo ubigeo en JSON (25 dep / 196 prov / ~1892 dist), validado en server con `resolveUbigeo`.

## Archivos

- `RosverSac/server/data/ubigeo/*`
- `RosverSac/server/src/lib/ubigeo.ts`
- `RosverSac/server/src/routes/peru.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/server/sql/018_quote_requests.sql`
- `RosverSac/src/shared/ui/peru-ubigeo-fields.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `docs/features/quotes.md`
- `docs/changes/0174-cotizar-ubigeo-persistencia.md`

## Cómo verificar

- [ ] `/cotizar`: elegir Lima → Lima → Miraflores; provincias/distritos cargan en cascada
- [ ] Completar agencia + productos → Enviar: toast con `QT-…` y fila en `quote_requests`
- [ ] WhatsApp incluye dirección y agencia
- [ ] Móvil / tablet / desktop OK
