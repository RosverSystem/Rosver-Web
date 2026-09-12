# Cambio: buscador con sugerencias y filtro en vivo

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Al escribir (≥2 caracteres) aparece un panel de sugerencias (nombre, SKU, marca).
- Clic en una sugerencia → ficha del producto; “Ver todos en catálogo” → `/catalogo?q=…`.
- En `/catalogo`, el grid se filtra **mientras se escribe** (sin depender solo de la lupa).
- Enter / lupa siguen abriendo SKU exacto o el listado filtrado.

## Por qué

Con “la” en el input parecía que “no funciona”: la búsqueda solo corría al enviar, sin feedback al tipear.

## Cómo

`HeaderSearchBox` en `PublicNavbar` + debounce 200 ms de `?q=` en rutas de catálogo; sync del input si se limpia el chip “Quitar búsqueda”.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0152-buscador-sugerencias-vivo.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] En catálogo, escribir `la` → sugieren Lámpara / Taladro y el grid se reduce
- [ ] Clic en sugerencia → `/producto/…`
- [ ] En inicio, escribir `la` → panel; Enter o lupa → `/catalogo?q=la`
- [ ] SKU exacto (ej. `RS-1042`) → ficha directa
- [ ] Móvil: mismo panel bajo el buscador redondo
- [ ] Tablet / desktop: panel alineado al input del header
