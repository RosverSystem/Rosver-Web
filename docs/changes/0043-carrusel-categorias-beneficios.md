# Cambio: Carruseles circulares de categorías y beneficios

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Nuevo `CategoryCarousel`: categorías en círculos (estilo featured), tipografía display uppercase, autoplay cada 5 s (pausa en hover).
- `TrustBadges` rediseñado al mismo patrón circular + título “Por qué comprar en Rosver”.
- `TrustBar`: números y labels más llamativos (`font-display`, uppercase).
- Home usa `CategoryCarousel` en lugar de `CategoryGrid` (el grid queda en el repo por si se reutiliza).

## Por qué

Se pidió presentar beneficios/categorías como círculos en slider automático, con texto más llamativo.

## Cómo

Scroll horizontal nativo + `setInterval` que avanza un card; `prefers-reduced-motion` desactiva autoplay. Intervalo 5 s (no 5 min: con minutos el carrusel casi no se mueve).

## Archivos

- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/TrustBadges.tsx`
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0043-carrusel-categorias-beneficios.md`

## Cómo verificar

- [ ] Home: fila de círculos “Por qué comprar en Rosver” avanza sola cada ~5 s
- [ ] Home: “Categorías destacadas” en círculos con foto/ícono y label display
- [ ] Hover pausa el autoplay; click en categoría va a `/catalogo/:slug`
- [ ] Stats debajo con tipografía más fuerte
- [ ] Móvil / tablet / desktop: scroll horizontal usable, sin overflow raro
- [ ] Con reduced-motion: sin autoplay
