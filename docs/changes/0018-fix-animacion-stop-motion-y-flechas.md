# 0018 — Fix animación "invisible" + estilo stop-motion + flechas + botón

**Fecha:** 2026-08-27
**Tipo:** fix

## Qué cambió

- **Bug real corregido:** `HeroCampaignChristmas` no tenía `overflow-hidden` en su contenedor raíz. El logo "RosVer Sac" (posicionado cerca del borde inferior) se salía visualmente del carrusel y se veía superpuesto con la sección de abajo (reportado por el usuario con captura de su propio navegador).
- **Bug real corregido:** el crossfade del `HeroCarousel` (0.9s, `power2.inOut`) tapaba la animación interna del slide de campaña — para cuando el fade terminaba de revelar el slide, las 10 capas ya habían avanzado gran parte de su recorrido "por detrás" del fade, dando la sensación de que "no había animación, todo aparecía ya armado". Se bajó a 0.3s (`power1.inOut`) para que el crossfade sea un corte rápido y la coreografía interna sea la animación que realmente se ve.
- **Estilo de movimiento cambiado a "stop motion" (pedido explícito):** las 10 capas y el botón ahora usan `ease: 'steps(6)'` en vez de un ease suave (`power3.out`) — cada pieza salta en pasos discretos en vez de deslizarse, que es el efecto que se pidió.
- **Botón "Ver ofertas" rediseñado:** antes era un pill blanco simple mal ubicado (chocaba visualmente con el logo). Ahora: posicionado en el hueco real entre el titular y el logo (sin superposición, verificado en %), con flecha "→" que se desplaza al hover, invierte a rojo sólido con texto blanco al pasar el mouse, sombra más marcada, y su propia animación de entrada (fade + scale, después de que termina la coreografía de las demás piezas).
- **Navegación manual agregada:** flechas prev/next (`IconChevronLeft`/`IconChevronRight`, nuevos en `shared/ui/icons.tsx`) a los costados del carrusel, además de los puntos existentes.

## Por qué

El usuario probó en su propio navegador y confirmó que la animación no se veía — "cuando carga no veo animación, solo es estático, quería tipo stop motion". Dos causas reales (no solo percepción): el crossfade del carrusel efectivamente ocultaba el movimiento, y el bug de overflow hacía que lo único "raro" visible fuera el logo mal cortado, reforzando la sensación de que algo estaba estático/roto. Además pidió explícitamente el estilo "stop motion" (pasos discretos) en vez de una animación suave, y una fecha/flecha para cambiar de slide a mano.

## Cómo

- `steps(6)` es la función de easing de GSAP para movimiento discontinuo — mismo mecanismo de tween, solo cambia la curva de interpolación.
- El hueco para el CTA se calculó a partir de las coordenadas reales de Canva: el titular termina en `top 436.7` (154.1 + 282.6 de alto), el logo empieza en `top 524.6` — el botón usa `top 452, height 62` (termina en 514, con margen antes del logo).
- Las flechas reutilizan el mismo `goTo(i)` que los puntos (con wrap-around `%`), así que ambos controles quedan sincronizados.
- Verificado en el navegador: `overflow: hidden` presente en el contenedor de capas; posición del CTA en `%` sin solaparse con el logo; ambos botones de flecha existen y disparan `goTo`.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroCampaignChristmas.tsx`
- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`
- `RosverSac/src/shared/ui/icons.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] `overflow: hidden` confirmado en el contenedor de capas (ya no se sale el logo)
- [x] Botón verificado en posición `top 75.3% / height 10.3%` — no se solapa con el logo (`top 87.4%`)
- [x] Flechas prev/next presentes y funcionales (`goTo`)
- [ ] **Verificación visual pendiente del usuario:** confirmar que ahora sí se ve la entrada en pasos ("stop motion") de cada pieza al llegar al slide navideño, que el botón no choca con nada, y que las flechas funcionan
