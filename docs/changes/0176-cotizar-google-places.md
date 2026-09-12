# Cambio: Cotizar — Google Places para direcciones

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Integración **Google Places Autocomplete** (`@googlemaps/js-api-loader`) cuando hay `VITE_GOOGLE_MAPS_API_KEY` — misma calidad que Google Maps.
- Fallback OSM mejorado: ya no mezcla distritos basura (“La Libertad”) en búsquedas de calle.
- `POST /api/peru/match-ubigeo` para mapear componentes Google → ubigeo.

## Por qué

OpenStreetMap no tiene el detalle de asociaciones/números de Google en Perú; el usuario lo comparó con Maps.

## Cómo

- Front: `PeruAddressSuggest` elige Google si hay key; si no, OSM.
- Activar: crear clave en Google Cloud (Maps JavaScript API + Places API) y ponerla en `.env`.

## Archivos

- `RosverSac/src/shared/ui/peru-address-suggest.tsx`
- `RosverSac/server/src/lib/address-suggest.ts`
- `RosverSac/server/src/routes/peru.ts`
- `RosverSac/.env.example`
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [ ] Sin key: calles ya no proponen distritos irrelevantes
- [ ] Con `VITE_GOOGLE_MAPS_API_KEY`: sugerencias tipo Maps (ej. Libertad 780 Asoc Horizonte Azul)
- [ ] Al elegir, se llena departamento / provincia / distrito
