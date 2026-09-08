# 0014 — Hero animado (SplitText) + contadores en Confianza

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- `features/catalog/ui/Hero.tsx`: reveal cinético al cargar Home. `SplitText` (`type: 'words', mask: 'words'`) parte el titular "Catálogo Rosver Sac" en palabras; un timeline de GSAP anima en secuencia: eyebrow → palabras del titular (stagger) → subtítulo → CTAs (stagger) → imagen (scale + fade). Corre una sola vez al montar (no depende de scroll, el Hero ya está sobre el pliegue).
- `features/catalog/ui/TrustBar.tsx`: los 4 números ("+10", "6", "+500", "24h") ahora cuentan hacia arriba desde 0 hasta su valor real cuando el bloque entra en viewport, en el mismo timeline que lo revela (`ScrollTrigger`, `once: true`). Se sacó del `<ScrollReveal>` genérico en `HomePage.tsx` porque ahora maneja su propia animación (reveal + conteo combinados).
- `shared/lib/gsap.ts`: registra también el plugin `SplitText` (gratuito desde 2025, incluido en el paquete `gsap` sin licencia aparte) y centraliza `prefersReducedMotion()` como export — antes esa función estaba duplicada en `IntroTransition.tsx` y `scroll-reveal.tsx`.
- `IntroTransition.tsx` y `scroll-reveal.tsx`: actualizados para importar `prefersReducedMotion` desde `shared/lib/gsap` en vez de redefinirla cada uno.

## Por qué

El usuario mostró gsap.com como referencia de banner animado y pidió construir algo similar. Se acordó no copiar el estilo abstracto (formas flotando, tipografía gigante sin contexto) porque Rosver necesita generar confianza en un visitante que no conoce al importador — en cambio se tomaron las **técnicas** de esa referencia (reveal de texto, contador animado) aplicadas a contenido real del negocio: el titular, la propuesta de valor y las cifras de confianza. Ver `docs/architecture/05-estructura-informacion-y-captacion.md`.

No hay fotos de producto reales todavía (`public/` solo tiene variantes del logo; `src/assets/hero.png` es arte genérico del scaffold de Vite, no una imagen de Rosver) — la imagen del Hero sigue siendo el placeholder `WireImage`, ahora con su propia animación de entrada (scale + fade) lista para cuando haya una foto real que poner ahí.

## Cómo

- `SplitText` con `mask: 'words'` pone automáticamente `aria-label` con el texto completo en el `<h1>` y `aria-hidden="true"` en los fragmentos — verificado en el DOM, no hace falta trabajo extra de accesibilidad.
- El timeline del Hero se limpia devolviendo `() => split.revert()` desde el callback de `useGSAP` — `useGSAP` revierte los tweens de GSAP solo, pero no sabe de la mutación del DOM que hace `SplitText`, así que hay que revertirla a mano.
- Contadores: un objeto plano `{ val: 0 }` tweeneado con GSAP; `onUpdate` escribe el `textContent` ya formateado (prefijo/sufijo parseados del string original, ej. `"+500"` → prefijo `"+"`, valor `500`). No se usó ningún plugin de "number counter" — un tween normal alcanza.
- Verificado en el navegador: el `<h1>` mantiene el texto correcto vía `aria-label`, y saltando el timeline del Hero a `progress(1)` en consola se confirmó que las palabras llegan a `opacity: 1` / `transform: translate(0,0)` — el entorno de este agente no compone frames en tiempo real (mismo caso que cambios anteriores de GSAP), así que la verificación de timing exacto queda para el usuario.

## Archivos

- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/shared/lib/gsap.ts`
- `RosverSac/src/app/layout/IntroTransition.tsx`
- `RosverSac/src/shared/ui/scroll-reveal.tsx`
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] `<h1>` conserva "Catálogo Rosver Sac" como texto accesible (`aria-label`) aunque esté partido en palabras animadas
- [x] Timeline del Hero verificado hasta el final (saltando `progress(1)`): todas las palabras llegan a su estado visible correcto
- [ ] **Verificación visual pendiente del usuario:** `cd RosverSac && npm run dev` → `/` — el titular debe entrar palabra por palabra, y al hacer scroll hasta "Confianza" los números deben contar desde 0 hasta su valor
- [ ] Con "reducir movimiento" activado, ni el Hero ni los contadores deben animar — el contenido aparece directo
- [ ] _(UI)_ Repetir en móvil y tablet — el stagger de palabras no debe romper el salto de línea del titular

## Qué falta para verlo con contenido real

- **Imagen del Hero:** una foto real (producto destacado, bodega/almacén, o composición de categorías) en formato horizontal (~16:10) para reemplazar el `WireImage` — hoy no existe ninguna en el proyecto.
- **Cifras de confianza:** confirmar si "+10 años", "6 rubros", "+500 clientes", "24h de respuesta" son datos reales de Rosver o si hay que ajustarlos.
