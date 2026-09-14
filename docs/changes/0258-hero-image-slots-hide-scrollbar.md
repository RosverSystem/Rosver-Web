# Cambio: Restaurar slots de imagen del hero + ocultar scrollbar

**Fecha:** 2026-09-13  
**Tipo:** fix

## Qué cambió

- Hero vuelve al **strip multipanel**: CTA + **5 slots** (placeholders 800×1200 si aún no hay fotos CMS).
- CTA compacto con el estilo nuevo (eyebrow, título, PDF + Ver catálogo) sin comerse todo el ancho.
- Scrollbar de página **oculto** en toda la app (scroll sigue funcionando).
- Versión `0.1.61`.

## Por qué

Rosa necesita el espacio visible para las imágenes del hero, y no quiere la barra de scroll visible.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/src/styles/global.css`
- `RosverSac/package.json`
- `docs/changes/0258-hero-image-slots-hide-scrollbar.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` muestra CTA a la izquierda + 5 paneles placeholder (Panel 1…5, 800×1200)
- [ ] Al subir slides CMS con imagen, los placeholders se reemplazan
- [ ] No se ve scrollbar vertical en Chrome/Edge (scroll con rueda OK)
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
