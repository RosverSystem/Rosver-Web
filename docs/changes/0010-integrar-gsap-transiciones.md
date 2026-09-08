# 0010 — Integrar GSAP para transiciones de scroll

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- Nuevas dependencias: `gsap` y `@gsap/react` (`RosverSac/package.json`).
- `shared/lib/gsap.ts`: punto único de registro del plugin `ScrollTrigger` (`gsap.registerPlugin`). Todo el código debe importar `gsap`/`ScrollTrigger` desde aquí, no directo de `'gsap'`.
- `shared/ui/scroll-reveal.tsx`: componente `<ScrollReveal>` — anima su contenido (`opacity` + `y`) al entrar en viewport usando `useGSAP` (de `@gsap/react`) + `ScrollTrigger`, con `once: true` y respetando `prefers-reduced-motion` (si el usuario lo pide, no anima nada).
- `features/catalog/ui/HomePage.tsx`: todos los bloques debajo del Hero (Confianza, Categorías, Destacados, Banda CTA) ahora están envueltos en `<ScrollReveal>` con `delay` incremental (stagger sutil). El Hero queda visible de inmediato — no se anima, es lo primero que ve el visitante.
- `docs/architecture/04-stack-y-librerias.md`: documentada la convención Motion vs. GSAP.

## Por qué

El usuario pidió conectar GSAP para trabajar transiciones. El proyecto ya usa Motion (navbar), así que en vez de duplicar responsabilidad se definió una división clara: **Motion** para animación de componentes (layout, estado, `AnimatePresence`) y **GSAP** específicamente para lo que Motion no resuelve tan bien — reveals disparados por scroll vía `ScrollTrigger`. Se aplicó a Home como primer caso real porque es la vista con más contenido "por debajo del pliegue" (bloques de confianza, categorías, destacados) que se benefician de una entrada progresiva al hacer scroll.

No se aplicó a `CatalogPage` ni `ProductPage`: ahí el contenido es tarea (comprar/comparar), no marketing, y ocultarlo detrás de una animación de entrada perjudica la velocidad percibida — contradice la regla de captación de `05-estructura-informacion-y-captacion.md` (nada debe interponerse entre el visitante y la acción).

## Cómo

- `useGSAP({ scope: ref })` en vez de `useEffect` a mano: maneja el cleanup (`gsap.context().revert()`) automáticamente, incluida la doble invocación de efectos de React `StrictMode` (el proyecto usa `<StrictMode>` en `main.tsx`).
- Verificación del disparo del `ScrollTrigger` (posiciones `start`/`end`, `isActive`, cambio de `opacity` computado) hecha inspeccionando la instancia de GSAP directamente vía consola del navegador — el panel de previsualización de este entorno no renderiza con una altura de viewport real (`window.innerHeight` = 0 mientras el panel no está visible), así que no hay captura de pantalla del scroll funcionando; la lógica se confirmó correcta a nivel de instancia de `ScrollTrigger` y el diseño (`start: "top 85%"`, `once: true`) es el patrón estándar recomendado por GSAP.
- **Nota lateral:** durante la instalación, un `cd` que no persistió entre comandos hizo que `npm install gsap @gsap/react` corriera por error en la raíz del repo (creó `package.json`/`package-lock.json`/`node_modules` ahí). Se detectó y limpió antes de reinstalar correctamente dentro de `RosverSac/`.

## Archivos

- `RosverSac/package.json`, `RosverSac/package-lock.json`
- `RosverSac/src/shared/lib/gsap.ts`
- `RosverSac/src/shared/ui/scroll-reveal.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] Verificado por consola: los bloques debajo del Hero arrancan en `opacity: 0` (Hero permanece en `opacity: 1`)
- [ ] **Verificación visual pendiente del usuario** (el entorno de este agente no compone el scroll real): `cd RosverSac && npm run dev` → abrir `/` y hacer scroll — Confianza, Categorías, Destacados y la banda CTA deben aparecer con un fade + slide sutil, uno tras otro
- [ ] Con "reducir movimiento" activado en el sistema operativo, las secciones deben aparecer directamente sin animación
- [ ] _(UI)_ Repetir el scroll en móvil y tablet — el reveal no debe romper el layout ni causar salto de contenido
