# Cambio: Hero con más profundidad + CategoryGrid con ritmo de color y animación de entrada

**Fecha:** 2026-09-04
**Tipo:** feature

## Qué cambió

- **`HeroCarousel.tsx`** (slide evergreen): el fondo pasó de un degradado plano de dos tonos a una composición con patrón de puntos sutil, dos glows difuminados (rojo y blanco) con flotación lenta (`@keyframes float-slow`, CSS puro), sobre el mismo degradado de marca.
- **`Hero.tsx`**: pequeño acento visual — una línea roja junto al eyebrow "IMPORTACIONES".
- **`CategoryGrid.tsx`** rediseñado: cada 3ª categoría (índices 0, 3, 6) usa una tarjeta oscura (`bg-rosver-ink`) con un glow rojo detrás del ícono en vez de blanco liso, creando un ritmo de color en vez de una grilla uniforme. Se agregó una animación de entrada (fade + rise + scale, escalonada por tarjeta) al hacer scroll, implementada con `IntersectionObserver` + transiciones CSS (no GSAP).
- `HomePage.tsx`: se quitó el `<ScrollReveal>` que envolvía `CategoryGrid`, porque ahora anima su propia entrada.

## Por qué

El usuario compartió capturas de la Home real (hero + grilla de categorías) y pidió explícitamente mejorar el diseño con libertad creativa: "eres libre de diseño, mejora todo el inicio, es un ecommerce, algo mejor con animaciones e innovación, nuevos estilos". El hero se veía como un degradado plano sin textura y la grilla de categorías era uniforme (mismo blanco/gris en las 8 tarjetas), sin ninguna animación de entrada.

## Cómo — hallazgo importante durante la implementación

La primera versión de la animación de entrada de `CategoryGrid` se hizo con GSAP + `ScrollTrigger` (mismo patrón que `shared/ui/scroll-reveal.tsx`), pero **las tarjetas quedaban permanentemente invisibles** (opacity 0) incluso después de que el `ScrollTrigger.onEnter` se disparaba correctamente (confirmado con logging). Se descubrió además que la consola tiene **181 warnings de `"Invalid scope"`** provenientes de `gsap.context()` en TODO el sitio (no algo introducido en este cambio) — un problema preexistente en cómo `@gsap/react` (`useGSAP`) resuelve el `scope` en el primer render, antes de que el `ref` esté adjunto al DOM.

Dado que ese problema es sistémico y no aislado a esta tarea, se optó por **no depender de GSAP para esta animación puntual**: se reimplementó con `IntersectionObserver` nativo + clases de Tailwind con `transition-delay` por índice, un enfoque más simple y confiable para un "fade in al hacer scroll" que no necesita timeline ni scrubbing. Queda pendiente investigar y corregir el warning de GSAP en el resto del sitio (ver sección siguiente).

## Pendiente (fuera de este cambio, detectado durante la verificación)

Los **181 warnings `"Invalid scope"`** de GSAP existen en toda la app (`Hero.tsx`, `TrustBar.tsx`, `ScrollReveal`, `HeroCampaignChristmas.tsx`, etc.) desde que se introdujo GSAP. Visualmente no rompieron nada donde se probó antes (los reveals sí se ven), pero es un warning real y sistémico que vale la pena investigar a fondo — podría estar causando fallos intermitentes similares al de este cambio en otros componentes bajo ciertas condiciones de timing/StrictMode.

## Archivos

- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`
- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/styles/global.css`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] Hero muestra patrón de puntos + glows con flotación sutil, sin afectar legibilidad del texto.
- [x] `CategoryGrid`: tarjetas oscuras alternadas visibles, animación de entrada (fade+rise) al hacer scroll, sin quedar invisibles.
- [x] Sin errores de consola en carga limpia (verificado en pestaña nueva).
- [x] _(UI)_ Verificado en **móvil** (375px), **tablet** (768px) y **desktop** — sin overflow horizontal, grilla de categorías reacomoda correctamente (2 cols → 4 cols).
- [x] Respeta `prefers-reduced-motion` (el estado `visible` inicia en `true` si está activo, sin depender de scroll).
