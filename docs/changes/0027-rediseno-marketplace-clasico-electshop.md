# Cambio: Rediseño completo a estilo marketplace clásico (referencia "Electshop"), regla obligatoria

**Fecha:** 2026-09-04
**Tipo:** feature

## Qué cambió

Rediseño estructural del Home y del header público, siguiendo como referencia obligatoria un screenshot de una plantilla ecommerce clásica ("Electshop": barra de utilidad, header con buscador + dropdown de categorías, nav sólido con mega-menú, hero con imagen, franja de confianza en caja, grillas de producto con rating/badges/precio tachado, banners promo pareados, sección con tabs). Se replicó la estructura y densidad de componentes, con la paleta de marca de Rosver (rojo/negro/blanco) en vez del turquesa de la referencia — confirmado explícitamente con el usuario.

- **`app/layout/PublicNavbar.tsx`** reescrito por completo: header estático de 3 niveles (antes era un navbar flotante estilo Aceternity con blur al hacer scroll). Nivel 1: barra de utilidad (envíos + cotizar/ayuda). Nivel 2: logo, buscador con selector "Todas" + botón, cuenta/favoritos/carrito con contador. Nivel 3: barra roja sólida con dropdown "Ver categorías" (usa `CATEGORIES` real) + links (Inicio/Catálogo/Ofertas/Contacto/Cotizar) con badges "OFERTA"/"NUEVO". Menú móvil con drawer propio (categorías + links).
- **`shared/ui/resizable-navbar/`** eliminado — quedó sin uso tras el rediseño del header (patrón Aceternity de navbar flotante).
- **`features/catalog/model/mocks.ts`**: `Product` ahora incluye `vendor`, `rating`, `reviewCount`, `originalPrice` (opcional). Se agregaron 2 productos nuevos (hogar, iluminación) para tener contenido en más pestañas/tabs. `TRUST_BADGES` pasó de 4 a 5 ítems con `sublabel`, alineado a la franja de confianza de la referencia (envíos, devoluciones, pago seguro, compra segura, soporte 24/7).
- **`shared/ui/rating-stars.tsx`** (nuevo) + `IconStar`/`IconStarOutline` en `shared/ui/icons.tsx`.
- **`ProductCard.tsx`** rediseñado: imagen sin borde propio, badge de descuento (`-14%`) arriba a la izquierda, vendor, rating con estrellas + reviews, precio tachado + precio final.
- **`TrustBadges.tsx`**: de 4 tarjetas centradas a una franja bordeada de 5 ítems (ícono + label + sublabel), como la referencia.
- **`HeroCarousel.tsx`** reescrito: hero contenido (no full-bleed), texto a la izquierda + ilustración a la derecha (círculos + ícono, placeholder honesto sin foto real), 2 slides con autoplay y dots — reemplaza el carrusel full-bleed con la campaña navideña animada en GSAP/Canva.
- **`CategoryGrid.tsx`**: de tarjetas con borde negro/sombra dura (regla neo-brutalista de `0026`, ya retirada) a tarjetas simples con borde fino, consistente con la nueva dirección.
- **`shared/ui/section-heading.tsx`** simplificado: se retiró el chip numerado + texto con eco (neo-brutalista); ahora es un título con una línea de acento corta debajo, como "Latest Products" en la referencia.
- **`PromoBanners.tsx`** (nuevo): dos banners oscuros lado a lado con CTA.
- **`TrendingProducts.tsx`** (nuevo): sección con tabs (categorías con productos) que filtran una grilla de productos.
- **`HomePage.tsx`** reordenado: Hero → TrustBadges → TrustBar (stats) → CategoryGrid → Productos destacados → PromoBanners → TrendingProducts (tabs) → HowToBuy → IndustrySolutions → CtaBand.
- **Archivos eliminados** (quedaron huérfanos tras el nuevo hero): `features/catalog/ui/Hero.tsx`, `features/catalog/ui/HeroCampaignChristmas.tsx`, `public/banners/` (assets de la campaña navideña exportados de Canva).
- **Bug real encontrado y corregido durante la verificación:** en el header móvil, el logo quedaba renderizado al final (después del carrito) en vez de entre el botón de menú y las acciones. Causa: `order-2` en el logo no garantiza "segunda posición" — al haber dos elementos con `order` por defecto (0) a ambos lados, flexbox los agrupa antes que cualquier `order` mayor, sin importar su posición en el DOM. Se corrigió asignando `order-1` al botón de menú y `order-3` al contenedor de acciones (cuenta/favoritos/carrito), dejando `order-2` solo al logo.

## Por qué

El usuario compartió el screenshot de referencia y lo declaró **regla de estilo obligatoria** ("tal cual, no nos saldremos del estilo"). Se confirmó con una pregunta puntual que la paleta de marca de Rosver se mantiene (no se copia el turquesa). Esta regla **reemplaza** la dirección neo-brutalista adoptada apenas en el cambio anterior (`0026`), que quedó retirada — ver memoria actualizada `feedback_visual_style_rosversac`.

**Se descarta el sistema de campaña navideña en GSAP/Canva** (`HeroCampaignChristmas`, `Hero.tsx`, assets de `public/banners/`) porque su estética (full-bleed, fondo oscuro dramático, capas animadas complejas) no encaja con el hero contenido y simple de la nueva referencia. Era trabajo elaborado de fases anteriores; se documenta aquí explícitamente para que quede registro de por qué se eliminó.

## Cómo

- Todo el lenguaje de color nuevo usa los tokens existentes (`--color-rosver-red`, `--color-rosver-ink`, `--color-rosver-soft`), sin introducir colores nuevos.
- El header nuevo no usa Motion/`resizable-navbar` (ya no aplica el patrón de navbar flotante); es un header estático simple, más cercano al comportamiento real de un ecommerce clásico.
- `TrendingProducts` reutiliza `ProductGrid`/`ProductCard` en vez de duplicar el layout de tarjetas.
- No se implementó el patrón "card grande destacada + fila de cards chicas" que se ve en la sección de tendencias de la referencia (bento de tamaños mixtos) — se prefirió una grilla uniforme con tabs, más simple y sin el riesgo de `grid-span` en múltiples breakpoints que ya causó un problema similar en `0025`.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/shared/ui/resizable-navbar/` (eliminado)
- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/shared/ui/icons.tsx`
- `RosverSac/src/shared/ui/rating-stars.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/TrustBadges.tsx`
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`
- `RosverSac/src/features/catalog/ui/Hero.tsx` (eliminado)
- `RosverSac/src/features/catalog/ui/HeroCampaignChristmas.tsx` (eliminado)
- `RosverSac/public/banners/` (eliminado)
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/shared/ui/section-heading.tsx`
- `RosverSac/src/features/catalog/ui/PromoBanners.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/app/providers/SmoothScroll.tsx` (comentario)

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] Header: dropdown "Ver categorías" abre y muestra las 8 categorías reales; menú móvil abre con links + categorías; orden correcto en móvil (menú → logo → carrito).
- [x] Home completo revisado por `get_page_text`/DOM: Hero, TrustBadges, TrustBar, CategoryGrid, Productos destacados (con badge/rating/precio), PromoBanners, TrendingProducts (tabs funcionando), HowToBuy, IndustrySolutions, CtaBand — todo presente y en orden.
- [x] `/catalogo` y `/producto/:slug` siguen funcionando con el `ProductCard` nuevo.
- [x] Sin errores de consola en carga limpia.
- [x] _(UI)_ Verificado en **móvil** (375px), **tablet** (768px) y **desktop** (1280px).

## Pendiente (fuera de este cambio)

`HowToBuy`, `IndustrySolutions` y `CtaBand` no se rediseñaron a fondo — se mantuvieron con su estilo existente (ya neutral, sin elementos neo-brutalistas que contradigan la nueva regla). El patrón "card grande + fila de chicas" de la sección de tendencias de la referencia no se implementó (ver sección "Cómo").
