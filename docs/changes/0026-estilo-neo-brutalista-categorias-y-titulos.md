# Cambio: Estilo neo-brutalista en categorías y títulos de sección (se retira el estilo tarjeta oscura + glow)

**Fecha:** 2026-09-04
**Tipo:** fix

## Qué cambió

- **`CategoryGrid.tsx`**: se retiró por completo el patrón "tarjeta oscura con glow rojo difuminado" (cada 3ª categoría) del cambio `0025`. Ahora las 8 tarjetas son uniformes: borde negro grueso (`border-2 border-rosver-ink`), sombra dura desplazada (`shadow-[4px_4px_0_0_var(--color-rosver-ink)]`, cambia a roja y se agranda al hover), ícono en cuadrado negro (no círculo), y un chip numerado (`01`, `02`...) con punto rojo arriba a la derecha de cada tarjeta.
- **`shared/ui/section-heading.tsx`**: nuevo prop opcional `eyebrow` — una etiqueta con borde negro y fondo rojo (ej. "01 / Catálogo") sobre el título. El título ahora tiene un efecto "eco": una copia del mismo texto en gris claro, desplazada unos px detrás, para dar profundidad tipo pop-art.
- Se agregó el `eyebrow` numerado (01–04) a las 4 secciones del Home que usan `SectionHeading`: Categorías, Proceso (`HowToBuy`), Destacados (`ProductGrid` en `HomePage`), Industrias (`IndustrySolutions`) — da una identidad editorial consistente a todo el Home.
- **Bug encontrado y corregido durante la implementación:** el `eyebrow` inicialmente quedaba renderizado al costado del título en vez de arriba, porque el contenedor del título usaba `inline-block` (necesario para que el texto "eco" se ajuste al ancho del contenido), lo que hacía que ambos elementos se comportaran como cajas en línea. Se corrigió cambiando el `span` del eyebrow a `flex w-fit` (nivel de bloque, se ajusta al contenido) para forzar el salto de línea antes del título.

## Por qué

El usuario compartió capturas del `CategoryGrid` recién implementado (`0025`) junto con referencias de un estilo neo-brutalista/técnico (bordes negros, sombra dura, chips "STEP 01", texto con eco tipo "DOMINIO TÉCNICO") y pidió explícitamente **eliminar el estilo de tarjeta oscura con glow como regla permanente** ("es una regla de por vida"), reemplazándolo por algo "estilo cómic o innovador, con reglas de texto". Se guardó esta decisión como memoria persistente (`feedback_visual_style_rosversac`) para no repetir el patrón prohibido en trabajo futuro, y una memoria de proyecto (`project_rosversac_home_redesign`) con el estado actual del lenguaje visual del Home.

## Cómo

- El lenguaje neo-brutalista se adaptó a la paleta de marca de Rosver (rojo/negro/blanco) en vez de copiar el azul de la referencia.
- La sombra dura se implementó con `box-shadow` de offset fijo (sin blur) vía clases arbitrarias de Tailwind, referenciando los tokens de color del tema (`var(--color-rosver-ink)`, `var(--color-rosver-red)`) en vez de hardcodear hex.
- Al ser `SectionHeading` un componente compartido, el `eyebrow` + efecto eco se propaga automáticamente a las 4 secciones sin tocar cada una individualmente (solo se agregó el texto del `eyebrow` por sección).
- La animación de entrada de `CategoryGrid` (`IntersectionObserver`, de `0025`) se mantuvo sin cambios — solo cambió la apariencia de la tarjeta, no su lógica de aparición.

## Archivos

- `RosverSac/src/shared/ui/section-heading.tsx`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/catalog/ui/HowToBuy.tsx`
- `RosverSac/src/features/catalog/ui/IndustrySolutions.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] `CategoryGrid`: las 8 tarjetas son uniformes (sin tarjetas oscuras), con borde negro, sombra dura roja al hover, ícono en cuadrado negro y chip numerado.
- [x] Los 4 `eyebrow` (`01 / Catálogo`, `02 / Proceso`, `03 / Destacados`, `04 / Industrias`) se ven arriba de cada título, no al costado.
- [x] Sin errores de consola en carga limpia.
- [x] _(UI)_ Verificado en **móvil** (375px), **tablet** (768px) y **desktop** — la grilla de categorías reacomoda 2→4 columnas sin overflow ni recortes.

## Pendiente (fuera de este cambio)

`IndustrySolutions`, `TrustBadges`, `CtaBand`, `ProductCard` y el cuerpo de las tarjetas de `HowToBuy` todavía no adoptan el lenguaje de borde negro + sombra dura (solo heredaron el `eyebrow` numerado vía `SectionHeading`). Migrarlos queda para cuando el usuario lo pida, según lo registrado en la memoria de proyecto.
