# Cambio: Scrollbar delgado tipo pill

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Scrollbar a **4px** (más delgado).
- Track `rosver-soft` con `border-radius` full (pill) y margen vertical.
- Thumb `rosver-muted` pill; hover rojo Rosver.

## Por qué

Referencia pedida: scroll fino, track claro redondeado y thumb gris pill.

## Cómo

Solo CSS webkit + `scrollbar-width/color` para Firefox. Sin librerías.

## Archivos

- `RosverSac/src/styles/global.css`
- `docs/changes/0042-scrollbar-delgado-pill.md`

## Cómo verificar

- [ ] Scroll muy fino (≈4px) con forma pill
- [ ] Track gris claro visible; thumb más oscuro
- [ ] Hover → rojo
- [ ] Móvil / tablet / desktop OK
