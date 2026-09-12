# Cambio: Ubigeo correcto + manual + seed Postgres

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Matching de dirección: ya no muestra «Lima, Lima, Lima»; prioriza distrito real (`city` / barrio) y descarta `city=Lima` genérico.
- Dropdown: subtítulo `Distrito · Prov. X · Departamento`.
- Opción **Elegir a mano** en `/cotizar` (cascada dep → prov → dist).
- Tablas `peru_departments` / `peru_provinces` / `peru_districts` + seed desde JSON (`25` / `196` / `1892`).
- Script `npm run db:seed-ubigeo`; también en `db:setup` y boot producción.

## Por qué

Geoapify a veces manda `city=Lima` y el distrito en otro campo; el matcher viejo elegía el distrito «Lima». Faltaba edición manual y el catálogo en Postgres.

## Cómo

- `matchUbigeoFromPlaceNames` con hints priorizados y filtro depto/provincia.
- UI: `PeruUbigeoFields` bajo el autocomplete.
- Migración `020_peru_ubigeo.sql` + `seed-ubigeo.ts` (UNNEST upsert).

## Archivos

- `RosverSac/server/src/lib/ubigeo.ts`
- `RosverSac/server/src/lib/address-suggest.ts`
- `RosverSac/src/shared/ui/peru-address-suggest.tsx`
- `RosverSac/server/sql/020_peru_ubigeo.sql`
- `RosverSac/server/src/seed-ubigeo.ts`
- `RosverSac/server/src/boot.ts`
- `RosverSac/package.json`
- `docs/features/quotes.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/cotizar` búsqueda tipo «Asociación Portales del Norte 780» → subtítulo con **Los Olivos · Prov. Lima · Lima** (no tres veces Lima)
- [ ] Botón **Elegir a mano** abre selects de departamento / provincia / distrito
- [ ] `npm run db:seed-ubigeo` → 25 / 196 / 1892 filas
- [ ] _(UI)_ Móvil / tablet / desktop: dropdown y selects usables
