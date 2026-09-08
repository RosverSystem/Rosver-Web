# Cambio: Contenido de industrias real, footer completo y transiciones de página

**Fecha:** 2026-09-04
**Tipo:** fix

## Qué cambió

- **`INDUSTRY_SOLUTIONS` (mocks)**: se reemplazó "Mantenimiento industrial / Minería / Manufactura" (copiado estructuralmente de la referencia Ferrincorp, un proveedor pesado/minero) por los 4 segmentos que sí compran lo que Rosver importa según `CATEGORIES`: **Ferreterías y distribuidores**, **Construcción y acabados**, **Hogar y oficina**, **Mantenimiento y limpieza**. `IndustrySolutions.tsx` actualizado con los íconos correspondientes (`home`, `spray` en vez de `mountain`, `factory`).
- **Footer rediseñado** (`app/layout/Footer.tsx`): antes tenía 3 columnas simples + un botón suelto. Ahora: logo + tagline + 4 redes sociales (círculos blancos, mismo tratamiento que la navbar), columna de **Categorías** (las 8 reales, enlazadas a `/catalogo/:slug`), columna **Empresa** (Catálogo/Cotizar/Mi cuenta/Carrito), columna **Contacto** (formulario, teléfono, ciudad, botón WhatsApp), y barra inferior con copyright.
- **Shimmer en placeholders de producto** (`shared/ui/product-image-placeholder.tsx`): barrido de brillo diagonal continuo (`@keyframes shimmer` en `global.css`) sobre el gradiente, para que el placeholder se sienta "vivo" mientras no hay fotografía real. Se desactiva solo con `prefers-reduced-motion` (ya cubierto por la regla global existente).
- **Transición de página** (`shared/ui/page-transition.tsx`, nuevo): fade + slide corto al entrar a cada página pública (Motion, no GSAP — es animación de componente, no de scroll). Se desactiva si `prefers-reduced-motion`.
- **Scroll al tope en cada navegación** (`app/providers/SmoothScroll.tsx`): antes, al navegar por SPA (ej. un link del footer) la página nueva se quedaba en el scroll donde estabas. Ahora la misma instancia de Lenis usada para el scroll suave hace `scrollTo(0, { immediate: true })` en cada cambio de ruta (o `window.scrollTo(0,0)` si Lenis está desactivado por reduced-motion).

## Por qué

El usuario marcó dos problemas concretos sobre un screenshot: (1) "Soluciones para cada industria" mostraba minería/manufactura, rubros que no tienen nada que ver con lo que Rosver realmente importa y vende (herramientas, ferretería, electrónica, hogar, textil, iluminación, limpieza industrial, materiales de construcción); (2) el footer se veía "simple". También pidió mejorar el diseño general y las animaciones de carga. Al verificar la transición de página recién agregada se encontró que la navegación no reseteaba el scroll — se corrigió como parte de dejar esa función bien terminada, no como pedido aparte.

## Cómo

- El contenido de industrias se derivó de `CATEGORIES` (fuente real del catálogo), no de la referencia externa.
- El shimmer es CSS puro (`transform`, sin JS por tick) para no romper la regla de rendimiento del proyecto.
- La transición de página usa Motion (ya es la librería designada para animación de componentes en `04-stack-y-librerias.md`); no se usó GSAP para esto.
- El reset de scroll se resolvió reutilizando la instancia de Lenis ya existente (vía `ref`) en vez de crear un mecanismo aparte, para no tener dos fuentes de verdad del scroll.

## Archivos

- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/ui/IndustrySolutions.tsx`
- `RosverSac/src/app/layout/Footer.tsx`
- `RosverSac/src/shared/ui/product-image-placeholder.tsx`
- `RosverSac/src/styles/global.css`
- `RosverSac/src/shared/ui/page-transition.tsx` (nuevo)
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/providers/SmoothScroll.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] Home → "Soluciones para cada industria" muestra Ferreterías/Construcción/Hogar y oficina/Mantenimiento — nada de minería ni manufactura.
- [x] Footer muestra logo, redes sociales, las 8 categorías reales, y contacto — sin verse vacío.
- [x] Navegar desde un link del footer (ej. "Cotizar") lleva al tope de la página nueva, no se queda en el scroll anterior.
- [x] Sin errores de consola en carga limpia.
- [ ] _(UI)_ Verificación manual del shimmer y la transición de página en movimiento (no se puede confirmar por screenshot estático; el código sigue el patrón CSS/Motion estándar ya usado en el resto del proyecto).
