# 0016 — HeroCarousel: banner full-bleed con imagen real de Canva

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- Nuevo `features/catalog/ui/HeroCarousel.tsx`: reemplaza al `Hero` estático como sección principal de Home. Es un banner **full-bleed** (ancho completo, fuera del `max-w-7xl`) con transición cruzada (GSAP `opacity`) entre 2 slides, autoplay cada 6s (pausa con hover/foco), puntos de navegación manual, y respeto a `prefers-reduced-motion`.
- `Hero.tsx` se adaptó para ser el contenido del slide "evergreen": ya no está envuelto en `WireBlock` (tarjeta con borde punteado) — ahora vive sobre un degradado de marca (`rosver-ink` → `rosver-red/50`) a pantalla completa, con texto en blanco. Mantiene el reveal cinético con `SplitText` de `0014`.
- Primer slide de campaña real: `public/banners/hero-navidad-desktop.png` (1920×600, 115 KB) — exportado directo del diseño de Canva `DAHTeOTwM5M` que el usuario compartió, con un CTA real ("Ver ofertas") superpuesto en HTML.
- `HomePage.tsx`: `HeroCarousel` se monta fuera del `<main>` (que sigue limitando a `max-w-7xl` el resto de la página) para lograr el ancho completo pedido.

## Por qué

El usuario compartió un link de Canva ("junto a GSAP créame una animación modelo a través de frame, créamelo ahí en Canva") con un diseño de 3 páginas a 1920×600 pensado como frames de una animación/campaña. Se leyó el diseño con las herramientas de Canva conectadas esta sesión: la página 2 es un banner navideño real y utilizable; las páginas 1 y 3 no tienen contenido usable (ver nota abajo). En vez de exportar un video/GIF desde Canva (que habría que embeber como archivo pesado autoplay — antipatrón explícito en `06-performance.md`), se construyó la transición **entre frames en el sitio real** con GSAP, que es más liviano, responsive y controlable, y se usó la imagen real de Canva como el primer contenido de producción del proyecto.

## Encontrado al leer el diseño de Canva (`DAHTeOTwM5M`, "animaciones")

- **Página 1:** no es un diseño — es una captura de la tabla de medidas de `docs/architecture/06-banners-hero-y-assets.md` (parece pegada sin querer como referencia). No se usó.
- **Página 2:** "Super ofertas navideñas" — diseño completo y correcto, exacto a 1920×600. Es la que se implementó.
- **Página 3:** vacía (solo el color de fondo rojo).

Esto se documentó en `06-banners-hero-y-assets.md` §5 para que el usuario lo sepa antes de seguir agregando slides en ese archivo de Canva.

## Cómo

- El carrusel usa `aspect-[3/4] md:aspect-[4/3] lg:aspect-[32/10]` — las mismas 3 proporciones ya documentadas para los banners (móvil/tablet/desktop), así que cuando lleguen los archivos por breakpoint el contenedor ya está pensado para ellos.
- Transición: cada slide es un `div` absoluto con `opacity` animado por GSAP (`useGSAP` con `dependencies: [index]`); sin `ScrollTrigger` porque no depende de scroll, depende del índice activo.
- Slide de campaña: `loading="eager"` solo en el primer slide (contenido crítico), `loading="lazy"` en el resto.
- Verificado en el navegador: la imagen se sirve correctamente en `/banners/hero-navidad-desktop.png` (confirmado 1920×600 real), y el cambio de slide por clic en los puntos actualiza `aria-hidden` correctamente (accesibilidad + estado). El crossfade animado en sí no se pudo ver en vivo — mismo entorno de este agente que no compone frames en tiempo real, ya documentado en cambios anteriores de GSAP.

## Pendiente

- Exportar las versiones tablet (1024×768) y móvil (750×1000) del slide navideño — hoy solo existe la de desktop, así que móvil/tablet reciben la misma imagen ancha vía `object-cover` (no ideal, ver `06-banners-hero-y-assets.md` §5).
- Corregir la página 1 del Canva y decidir qué va en la página 3 antes de agregar más slides de campaña.
- Reemplazar el degradado del slide "evergreen" por una foto real cuando exista (medidas ya documentadas).

## Archivos

- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`
- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/public/banners/hero-navidad-desktop.png`
- `docs/architecture/06-banners-hero-y-assets.md`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] `/banners/hero-navidad-desktop.png` responde 200 y son 1920×600 reales
- [x] Clic en los puntos del carrusel cambia el slide activo (`aria-hidden` verificado)
- [ ] **Verificación visual pendiente del usuario:** `npm run dev` → `/` — confirmar que el crossfade se ve fluido, el autoplay cicla cada 6s, y se pausa al pasar el mouse
- [ ] _(UI)_ Revisar en móvil/tablet cómo se ve la imagen navideña recortada (`object-cover`) mientras no exista su versión propia por breakpoint
