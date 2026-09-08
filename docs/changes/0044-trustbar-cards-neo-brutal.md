# Cambio: TrustBar en cards neo-brutal Rosver

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `TrustBar`: 4 cards independientes con borde ink, sombra dura (`4px 4px`), cuadrado rojo arriba a la izquierda, número grande, título uppercase y descripción.
- `TRUST_STATS` ahora incluye `description` por métrica.
- Hover: sombra pasa a rojo y ligero lift.

## Por qué

Referencia de stats en cards tipo neo-brutal (antes azul); se adapta a paleta Rosver (rojo/negro/blanco).

## Cómo

Grid 2×2 → 4 columnas en `lg`. Contadores GSAP al entrar en viewport (sin reduced-motion).

## Archivos

- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `docs/changes/0044-trustbar-cards-neo-brutal.md`

## Cómo verificar

- [ ] Home: 4 cards blancas con borde negro y sombra dura
- [ ] Números en rojo; título uppercase; subtítulo gris
- [ ] Hover mueve sombra a rojo
- [ ] Móvil (2 cols) / tablet / desktop (4 cols) OK
- [ ] Contadores animan al hacer scroll (si no hay reduced-motion)
