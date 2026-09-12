# Cambio: Cotizar — Geoapify + fallback Nominatim

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Autocomplete de dirección: **Geoapify** primero (`GEOAPIFY_API_KEY`).
- Si hay límite/cuota (429/403) o falla → **Nominatim** (gratis, ya implementado).
- Orden: Google server (si hay) → Geoapify → Nominatim.

## Por qué

Opción freemium (~3000 créd/día) mejor que OSM puro, sin tarjeta de Google.

## Cómo

- Endpoint Geoapify: `/v1/geocode/autocomplete?filter=countrycode:pe`
- Soft cooldown en memoria al detectar límite.

## Archivos

- `RosverSac/server/src/lib/address-suggest.ts`
- `RosverSac/server/src/config.ts`
- `RosverSac/.env.example`
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [ ] `/cotizar` sugiere direcciones Perú vía Geoapify
- [ ] Sin key o con cooldown → sigue respondiendo Nominatim
- [ ] No commitear `GEOAPIFY_API_KEY`
