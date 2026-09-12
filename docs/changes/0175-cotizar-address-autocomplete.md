# Cambio: Cotizar — autocomplete dirección + agencia simple

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Dirección de entrega: buscador con sugerencias (OpenStreetMap/Nominatim + ubigeo local) que autorellena departamento, provincia y distrito.
- Conserva el **número de puerta** escrito (OSM a menudo no lo trae); opcional `GOOGLE_MAPS_API_KEY` para Places como Maps.
- Agencia de transporte: solo nombre (sin repetir ubigeo).
- Migración `019_quote_agency_ubigeo_optional.sql`.

## Por qué

El ubigeo manual era pesado; se pedía UX tipo Maps/SUNAT y no duplicar ubicación en agencia.

## Cómo

- `GET /api/peru/address-suggest?q=`
- UI `PeruAddressSuggest`
- Sin Google Places (no hay key); OSM gratuito + catálogo ubigeo offline

## Archivos

- `RosverSac/server/src/lib/address-suggest.ts`
- `RosverSac/server/src/lib/ubigeo.ts`
- `RosverSac/server/src/routes/peru.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/server/sql/019_quote_agency_ubigeo_optional.sql`
- `RosverSac/src/shared/ui/peru-address-suggest.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`

## Cómo verificar

- [ ] Escribir “San Isidro Lima” o una avenida → aparecen opciones → al elegir se llena ubigeo
- [ ] Agencia solo pide nombre
- [ ] Enviar cotización guarda OK
- [ ] Móvil / tablet / desktop OK
