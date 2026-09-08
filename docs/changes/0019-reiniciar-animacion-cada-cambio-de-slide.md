# 0019 — Reiniciar la animación cada vez que cambia el slide

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- `HeroCampaignChristmas.tsx`: se quitó el ref `played` que bloqueaba la animación después de la primera vez. Ahora, cada vez que el slide vuelve a activarse (autoplay, flechas o puntos), las 10 capas y el botón se reinician a su posición/opacidad inicial y vuelven a animar hasta la final.
- `Hero.tsx`: el slide "evergreen" ahora recibe una prop `active` y su timeline (eyebrow → titular por palabras → subtítulo → CTAs) se reconstruye cada vez que `active` pasa a `true`, en vez de correr una sola vez al montar. `SplitText` se revierte y se vuelve a crear en cada activación (necesario porque parte el DOM del `<h1>`, algo que GSAP no deshace solo).
- `HeroCarousel.tsx`: pasa `active={i === index}` a `<Hero />` (antes no se lo pasaba).

## Por qué

El usuario pidió explícitamente que la animación se reinicie cada vez que el carrusel cambia de slide, no solo la primera vez que aparece cada uno.

## Cómo

- El mecanismo ya estaba listo para esto sin necesidad de lógica extra de "reset": `gsap.fromTo()` y `.from()` tienen `immediateRender: true` por defecto — cada vez que se llama de nuevo (por el cambio en `dependencies: [active]` de `useGSAP`), fuerzan el estado "desde" antes de animar al final, sin importar en qué posición haya quedado la ejecución anterior. Solo hacía falta quitar el guard que impedía que la lógica se volviera a ejecutar.
- `useGSAP` revierte automáticamente los tweens de la ejecución anterior cuando `active` cambia (antes de correr la nueva), y la función de cleanup manual (`split.revert()` en `Hero.tsx`) se sigue encargando de deshacer el split de texto entre una activación y la siguiente.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroCampaignChristmas.tsx`
- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] Confirmado en código: sin guard de "solo una vez"; `dependencies: [active]` en ambos componentes
- [ ] **Verificación visual pendiente del usuario:** `npm run dev` → dejar correr el autoplay (o usar las flechas) varias vueltas — el titular evergreen y las piezas navideñas deben reiniciar su animación cada vez que su slide vuelve a aparecer, no solo la primera
