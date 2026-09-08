# Cambio: Buscador del header más corto y con aire

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Buscador desktop: ya no `flex-1` a todo el ancho; tope `max-w-md` / `xl:max-w-lg`.
- Más `gap` entre logo, buscador y “Mi cuenta” (`gap-8` en lg).

## Por qué

El input quedaba pegado al logo y a la cuenta; se pedía más corto.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0051-buscador-header-mas-corto.md`

## Cómo verificar

- [ ] En desktop hay espacio claro entre logo ↔ buscador ↔ Mi cuenta
- [ ] El buscador no ocupa casi todo el header
- [ ] Móvil / tablet: buscador móvil intacto
