# Cambio: TrustBadges full-width desktop + TrustBar sin recorte

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `TrustBadges`: en `lg+` grilla de 5 columnas a todo el ancho (como la captura); carrusel/autoplay solo si hay overflow (móvil).
- `TrustBar`: padding para que la sombra dura no recorte la 4ª card (`24h`); `clearProps` tras el reveal GSAP.

## Por qué

En desktop los círculos quedaban pegados a la izquierda y la última card de stats se veía cortada (“2…”).

## Archivos

- `RosverSac/src/features/catalog/ui/TrustBadges.tsx`
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `docs/changes/0045-fix-trust-layout-desktop.md`

## Cómo verificar

- [ ] Desktop: 5 beneficios repartidos a lo ancho, sin scroll horizontal
- [ ] Móvil: se puede deslizar; autoplay solo si no caben todos
- [ ] Stats: se lee completo `+10`, `6`, `+500`, `24h` + título y descripción
- [ ] Móvil / tablet / desktop OK
