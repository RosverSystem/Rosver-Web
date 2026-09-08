# Cambio: Home con diseño real (fin de fase wireframe)

**Fecha:** 2026-09-03
**Tipo:** fix

## Qué cambió

- Se eliminó `WireBlock`/`WireImage` (bordes punteados + labels de debug) de **todas** las secciones del Home y de `ProductGrid`/`ProductCard`, reemplazándolo por estilos de producción reales (tarjetas, sombras, íconos, tipografía) usando la paleta de marca (`rosver-red`, `rosver-ink`, `rosver-soft`).
- Nuevo componente compartido `SectionHeading` (título + subtítulo + link "Ver más") reutilizado en `CategoryGrid`, `HowToBuy`, "Productos destacados" e `IndustrySolutions`.
- `TrustBar` ahora es una tarjeta blanca flotante que se superpone al borde inferior del hero (`-mt-10`/`-mt-14`), con divisores entre las 4 métricas.
- `CategoryGrid`: tarjetas con borde, sombra y hover `-translate-y`; el círculo de ícono conserva el hover de interacción (nudge + color), sin animaciones de aparición/loop.
- `HowToBuy`: envuelto en panel `bg-rosver-soft`; el número de paso pasó de texto tenue a badge circular sólido (`bg-rosver-ink`).
- `ProductGrid`/`ProductCard`: se quitó el prop `label` (breaking change interno); la card usa gradiente + ícono `IconBag` como placeholder de foto de producto (no hay fotografía real todavía).
- `TrustBadges`, `IndustrySolutions`, `CtaBand`: pasaron de bloques wireframe a tarjetas/banner reales (`CtaBand` con dos círculos decorativos difuminados sobre `bg-rosver-red`).
- `CatalogPage.tsx` se actualizó para seguir compilando tras el cambio de API de `ProductGrid` (se agregó `<h1>` real y controles de paginación sin `WireBlock`).

## Por qué

El usuario compartió como referencia el home de un catálogo B2B industrial (Ferrincorp) y, tras una primera pasada estructural (`0020`) que solo replicó las *secciones*, indicó explícitamente que el resultado no se parecía en nada a la referencia. La causa era que todas las secciones (nuevas y previas) seguían usando los primitivos de wireframe (`WireBlock`/`WireImage`) de la fase visual temprana del proyecto, es decir, seguían mostrando cajas punteadas con etiquetas de debug en vez de diseño real. Esta pasada gradúa el Home de wireframe a diseño de producción, manteniendo la paleta roja/negra de Rosver (no el naranja de la referencia).

## Cómo

- Reemplazo archivo por archivo de `WireBlock`/`WireImage` por marcado real con Tailwind v4 (bordes, sombras, radios, gradientes), sin introducir librerías nuevas.
- Los íconos interactivos usan únicamente `transition`/`group-hover` en CSS (no GSAP), conforme a `06-performance.md` — no son loops ni fades, se activan solo con la interacción del usuario.
- Se mantiene la fase "visual con mocks": no hay datos ni imágenes reales de producto; el placeholder de `ProductCard` es intencional hasta contar con fotografía.
- Pendiente conocido, no resuelto en este cambio: `FiltersPanel.tsx` (usado por `CatalogPage`) sigue en estilo wireframe y ahora contrasta con el grid de productos ya rediseñado.

## Archivos

- `RosverSac/src/shared/ui/section-heading.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/catalog/ui/HowToBuy.tsx`
- `RosverSac/src/features/catalog/ui/ProductGrid.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/TrustBadges.tsx`
- `RosverSac/src/features/catalog/ui/IndustrySolutions.tsx`
- `RosverSac/src/features/catalog/ui/CtaBand.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores (`RosverSac/`).
- [x] `http://localhost:5173` — Home carga sin errores de consola; se revisaron visualmente Hero, TrustBar, CategoryGrid, HowToBuy (vía texto), ProductGrid, TrustBadges, IndustrySolutions, CtaBand y footer.
- [x] `http://localhost:5173/catalogo` — grid y paginación renderizan con la nueva API de `ProductGrid`.
- [x] _(UI)_ Verificado en viewport reducido (~529px, rango tablet/móvil) sin overflow horizontal ni layout roto.
- [ ] _(UI)_ Verificación manual adicional en desktop ancho (≥1280px) recomendada antes de cerrar el pendiente de `FiltersPanel`.
- [x] _(UI)_ Sin animaciones nuevas de carga pesadas; hovers son solo `transform`/`opacity` vía CSS.
