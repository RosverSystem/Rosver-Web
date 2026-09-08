# Banner hero y assets de imagen — medidas para Canva

Especificación para diseñar en Canva el banner/hero de Home a partir de las referencias enviadas por el cliente (Grupo Shinán, Chamo Import). Se diseñan **3 versiones** (móvil / tablet / desktop) porque un banner fotográfico no se recorta bien solo con CSS — cada tamaño necesita su propia composición.

Cumple `06-performance` (rendimiento): el hero es la imagen más pesada del critical path, así que formato y peso están acotados abajo.

---

## 1. Referencia y qué tomamos de cada una

| Referencia | Qué tiene | Qué tomamos |
| --- | --- | --- |
| **Grupo Shinán** | Todo el texto (titular, bullets, badges) quemado dentro de la imagen, estilo flyer | Nada del texto — se ve recargado y no es editable ni accesible ni animable |
| **Chamo Import** | Foto de producto de impacto (herramientas) + botones reales en HTML sobre la imagen + fila de logos de marcas debajo | **Este es el patrón a seguir**: imagen para impacto visual, texto/CTA como HTML real encima (así seguimos usando el reveal animado de `Hero.tsx` y no perdemos accesibilidad/SEO) |

**Recomendación:** la imagen no lleva el titular ni el CTA quemados — esos siguen siendo el `<h1>` y los botones reales que ya existen en `features/catalog/ui/Hero.tsx` (con su animación GSAP). La imagen aporta el impacto visual (producto, contenedores, importación) y dejamos una zona con menos detalle (o un degradado sutil) del lado donde va el texto, para que siga siendo legible.

Pendiente de confirmar con el cliente: si "marcas relacionadas" son marcas/distribuidoras reales que Rosver maneja (como Truper, Stanley, etc. en el ejemplo de Chamo) o si se adapta a "categorías que manejamos" — la sección de abajo (`§4`) sirve para ambos casos, solo cambia si son logos de terceros o íconos propios.

---

## 2. Medidas del banner (Canva)

| Breakpoint | Canvas a crear en Canva | Aspecto | Se usa en |
| --- | --- | --- | --- |
| **Móvil** (&lt;768px) | **750 × 1000 px** | 3:4 (vertical) | `<768px` — pantalla angosta, composición más vertical |
| **Tablet** (768–1023px) | **1024 × 768 px** | 4:3 | 768–1023px |
| **Desktop** (≥1024px) | **1920 × 600 px** | ~3.2:1 (panorámico) | ≥1024px — banner ancho tipo Chamo Import |

### Zona segura ("safe zone")

- Dejar **mínimo 7% de margen** desde cada borde libre de elementos importantes (logo, producto principal) — `object-fit: cover` puede recortar distinto según el ancho exacto del visitante dentro de cada rango.
- Si el texto/CTA va como HTML real encima (recomendado, ver §1): reservar una franja con menos detalle o un degradado oscuro —
  - Desktop: franja izquierda (~40% del ancho) para que el `<h1>` sea legible.
  - Tablet: franja inferior o izquierda (~45%).
  - Móvil: franja superior o inferior (~35% de la altura) — en vertical el texto suele ir arriba o abajo, no al costado.

### Exportar

| Breakpoint | Formato | Peso objetivo |
| --- | --- | --- |
| Móvil | WebP (JPG como fallback si Canva no exporta WebP) | ≤ 120 KB |
| Tablet | WebP | ≤ 180 KB |
| Desktop | WebP | ≤ 280 KB |

Si Canva no exporta a WebP directamente: exportar en JPG calidad ~80% y convertir a WebP aparte (o decírmelo, lo convierto yo al recibir los archivos).

---

## 3. Cómo se implementa después (referencia técnica, no bloquea el diseño)

Cuando lleguen los 3 archivos:

- Se sirven con `<picture>` + `srcset`/`media` (uno por breakpoint), no un solo `<img>` escalado — evita servir el banner de 1920px a un celular.
- `loading="eager"` + `fetchpriority="high"` en el hero (es contenido crítico, no lazy).
- Reemplaza el `WireImage` actual en `features/catalog/ui/Hero.tsx`; el layout pasa de "texto + imagen en columnas" a **banner full-bleed** (ancho completo de la pantalla, no limitado al contenedor `max-w-7xl`) con el texto/CTA superpuestos.
- Se define `width`/`height` (o `aspect-ratio`) explícito por breakpoint para evitar CLS, según regla de rendimiento.

## 4. Fila de marcas/categorías debajo del banner (patrón Chamo Import)

No es un banner de Canva — es una fila de logos individuales:

- Cada logo: archivo aparte, **PNG con fondo transparente o SVG**, alto objetivo ~40–56px en desktop (se escala proporcional en móvil/tablet), ancho libre según el logo.
- Fondo neutro detrás de la fila (blanco o `rosver-soft`), logos en escala de grises u opacidad reducida con `hover` a color completo (patrón común, opcional).
- Si son categorías propias en vez de marcas de terceros: mismo formato, ícono + nombre corto.

---

## 5. Implementado: HeroWaveSlider (2026-09-07)

Home usa **`HeroWaveSlider`** (reemplaza `HeroBannerGrid` / grilla de 4 tiles):

Layout full-bleed estilo referencia grocery (adaptado a Rosver):

| Zona | Contenido |
| --- | --- |
| Fondo | Rojo marca (`bg-rosver-red`), full-bleed |
| Izquierda | Eyebrow + título + subtítulo + CTA pill |
| Derecha | Imagen de producto **sin caja** (object-contain + sombra), solapa la ola |
| Inferior | SVG ola blanca → transición a `BrandCarousel` |

- Datos: `features/catalog/model/home-hero-slides.ts` (`HomeHeroSlide`: `id`, textos, `ctaTo`, `imageUrl`, `visible`, `sortOrder`).
- Autoplay suave entre slides; dots; respeta `prefers-reduced-motion`.
- Responsive: columna única en móvil; 2 columnas desde `lg`.
- Fase lógica: slides desde `admin-content` / ERP.

### Histórico (retirado)

- `HeroBannerGrid` + `HOME_BANNERS` (grilla 1+1+2) — retirado 2026-09-07.
- `HeroCarousel` + campañas Canva navideñas — obsoletas (0027 / 0032). Conservar medidas Canva de §2 si en el futuro se diseñan artes full-bleed por breakpoint.

## 5.1 Implementado: BrandCarousel (2026-09-07)

Debajo del hero:

- Franja full-width con bordes superior/inferior (sin tarjeta ni cajas por logo).
- Label fijo a la izquierda + marquee CSS; pausa en hover / reduced-motion.
- Datos: `features/catalog/model/brands.ts`. Sin `logoUrl` → wordmark tipográfico.

## 6. Checklist antes de mandar los diseños

- [ ] 3 archivos (750×1000, 1024×768, 1920×600), nombrados `hero-movil`, `hero-tablet`, `hero-desktop`
- [ ] Ninguno lleva el titular/CTA principal quemado en la imagen (va como HTML)
- [ ] Zona segura respetada (7% de margen, franja para el texto según §2)
- [ ] Exportados en WebP (o JPG si no hay otra opción) dentro del peso objetivo de la tabla
- [ ] Logos de marcas/categorías (si aplica) como archivos individuales, no parte del banner
