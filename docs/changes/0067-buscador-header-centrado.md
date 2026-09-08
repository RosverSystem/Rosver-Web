# Cambio: Buscador del header centrado

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Fila principal del `PublicNavbar` en grid 3 columnas: logo | buscador | acciones.
- El buscador queda en el centro visual en desktop (`lg+`).

## Por qué

El buscador quedaba pegado al logo.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0067-buscador-header-centrado.md`

## Cómo verificar

- [ ] Desktop: buscador entre logo y “Mi cuenta”
- [ ] Móvil: buscador sigue debajo (fila propia)
