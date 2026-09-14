# Cambio: Botón Mi carrito del header (pill limpio)

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Pill del header: texto en **una sola línea** (`whitespace-nowrap`), altura fija, badge circular alineado.
- Etiqueta **«Mi carrito»** y enlace a `/carrito` (antes «Mi cotización» → `/cotizar` con texto partido).
- Mismo pill en móvil (icono + contador) y desktop (icono + texto + contador).
- Hover/sombra suaves; versión `0.1.52`.

## Por qué

El botón se veía mal: «Mi» / «cotización» en dos líneas y poco claro como carrito.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/package.json`
- `docs/changes/0250-header-mi-carrito-pill.md`

## Cómo verificar

- [ ] Header: pill rojo con texto en una línea (desktop)
- [ ] Contador circular blanco alineado a la derecha
- [ ] Clic → `/carrito`
- [ ] Móvil / tablet / desktop sin overflow
