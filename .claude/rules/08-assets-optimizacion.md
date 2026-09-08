# Assets livianos — logos e imágenes

Toda UI que use **logos, fotos de producto, banners o iconografía raster** debe cargarse **rápido**. El diseño no justifica assets pesados.

## Reglas

### Formato y peso
- Preferir **WebP/AVIF** (o SVG para logos/marcas tipográficas).
- Evitar PNG/JPG enormes en el critical path (hero, header, LCP).
- Logos de marcas: SVG o PNG transparente **recortado**; alto objetivo ~40–56px en UI (no archivos 2K+ “por si acaso”).
- Banners promocionales: preferir **CSS + SVG inline** (como `CatalogBanner`) antes que un JPG/PNG full-bleed pesado.

### Entrega en el DOM
- Siempre `width` + `height` (o aspect-ratio) para limitar CLS.
- `loading="lazy"` + `decoding="async"` en below-the-fold.
- Logo/header y LCP del hero: `loading="eager"` y `fetchPriority="high"` solo en **1** imagen crítica.
- `src` / CDN con tamaño razonable (`w=` acorde al display; no 2000px para thumb 200px).

### Prohibido / anti-patrones
- Usar el logo vertical 4K en un header de 40px.
- Carruseles con docenas de fotos full-res sin lazy.
- Fondos decorativos como foto enorme cuando basta un patrón CSS.
- Subir mocks Unsplash sin parámetros de resize/calidad.

### Checklist al cerrar UI con media
- [ ] No hay assets obviamente sobredimensionados en critical path
- [ ] Logos de marcas livianos o wordmark tipográfico
- [ ] Lazy en galerías / grids / below-fold
- [ ] Si el banner es tipográfico/geométrico → CSS/SVG, no bitmap

## Relación
Complementa `06-performance`. Si hay conflicto, gana **velocidad percibida** sin romper el diseño Rosver.

## Optimización — permiso
Se pueden usar skills y librerías de optimización (imágenes, lazy, compress, etc.) cuando aporten carga más rápida. Documentar en `04-stack-y-librerias.md` + `docs/changes/`.

Espejo Cursor: `.cursor/rules/08-assets-optimizacion.mdc`.
