# Cambio: Scrollbar de marca (sin franja blanca)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Scrollbar más fino (8px), track transparente.
- Thumb semitransparente oscuro; hover en `rosver-red`.
- Quitado el `border` blanco del thumb (era la franja blanca vertical sobre el hero rojo/negro).

## Por qué

El diseño anterior usaba borde `#fff` alrededor del thumb y se veía como una canaleta blanca rara al costado de la página.

## Cómo

`background-clip: padding-box` + borde transparente (mantiene aire sin pintar blanco). Firefox vía `scrollbar-color` con track transparente.

## Archivos

- `RosverSac/src/styles/global.css`
- `docs/changes/0040-scrollbar-diseno-marca.md`

## Cómo verificar

- [ ] En Chrome/Edge: scroll fino, sin franja blanca al lado del hero
- [ ] Hover del thumb → rojo Rosver
- [ ] En Firefox: thumb visible y track no blanco sólido
- [ ] Se ve bien en **móvil**, **tablet** y **desktop** (en móvil el scroll nativo puede ocultarse)
- [ ] Sin impacto de rendimiento
