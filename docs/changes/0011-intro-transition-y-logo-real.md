# 0011 — Cortina de intro (GSAP)

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- `app/layout/IntroTransition.tsx`: cortina de intro tipo transición de stream (stinger) que corre una vez por carga real de la app. Dos paneles de marca (`rosver-ink` y `rosver-red`) entran desde la izquierda cubriendo la pantalla, aparece el wordmark "ROS"/"VER" en blanco con un pop de escala, mantiene un instante, y los paneles salen por la derecha revelando la página. Bloquea el scroll (`document.body.style.overflow`) mientras dura y respeta `prefers-reduced-motion` (si el usuario lo pide, no se muestra nada).
- Montada en `app/App.tsx` como hermana de `<Routes>`, dentro de `<BrowserRouter>` — corre una sola vez por carga de documento, no en cada navegación interna del router.

## Historial dentro de este cambio (para que quede el contexto)

Se probó usar el logo real (`public/Logo_v.png`) en dos lugares y se revirtieron ambos a pedido explícito del usuario:

1. **Navbar público** (`PublicNavbar.tsx`): se probó reemplazar el logo de texto por una versión recortada de la imagen (`logo-navbar.png`, generado y luego eliminado). Se revirtió — el navbar sigue con el logo de texto original, sin cambios netos.
2. **Cortina de intro**: se probó mostrar `Logo_v.png` dentro de una tarjeta blanca centrada. Se revirtió por feedback directo ("se ve feo") — la cortina volvió a su wordmark de texto original en blanco.

**Estado final: ni el navbar ni la cortina de intro usan la imagen `Logo_v.png`.** Ambos mantienen el logo de texto (`"ROS"` rojo + `"VER"` negro/blanco según el fondo). Los archivos `Logo_v.png` y variantes siguen en `RosverSac/public/` sin uso actual, por si se retoma más adelante.

## Por qué

Se pidió una animación de carga de página tipo "cambio de pantalla" de stream (stinger transition). El logo real se evaluó en ambos lugares pero el resultado visual no convenció — se prioriza el criterio del usuario sobre mantener consistencia con el archivo de imagen.

## Cómo

- Timeline de GSAP (`gsap.timeline` + `useGSAP({ scope, dependencies: [] })`), no `ScrollTrigger` — es una secuencia por tiempo, no por scroll.
- **Bug real encontrado y corregido:** la primera versión intentaba "recordar" `document.body.style.overflow` antes de bloquear el scroll para restaurarlo al terminar. En React `StrictMode` (activo en `main.tsx`), el doble-montaje de efectos hace que el segundo montaje lea el valor ya puesto en `hidden` por el primero (que luego se revierte solo a nivel de GSAP, no del estilo del `body`), dejando el scroll bloqueado para siempre en desarrollo. Se simplificó a fijar siempre `''` al completar — no hay otro lugar en la app que dependa de un `overflow` distinto de auto/vacío.

## Archivos

- `RosverSac/src/app/layout/IntroTransition.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx` (sin cambios netos — se probó y revirtió)

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] La cortina se monta y bloquea el scroll al cargar; el timeline completa y limpia `overflow` correctamente (verificado saltando el timeline a `progress(1)` en consola, dado que el entorno de este agente no compone frames en tiempo real)
- [ ] **Verificación visual pendiente del usuario:** `cd RosverSac && npm run dev` → recargar `/` — debe verse el barrido rojo/negro, el wordmark en blanco, y la apertura hacia el contenido (~2.3s en total)
- [ ] Con "reducir movimiento" del sistema activado, la cortina no debe aparecer en absoluto
- [ ] Confirmar que el navbar sigue mostrando el logo de texto "ROS"/"VER" sin cambios
