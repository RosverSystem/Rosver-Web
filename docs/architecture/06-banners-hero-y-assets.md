# Banner hero y assets de imagen — medidas para diseñador / Canva

Especificación viva del hero de Home. **Modelo actual (2026-09-13):** carrusel **multipanel** tipo Katrina Imports, paleta Rosver.

Cumple `06-performance`: paneles livianos; solo el primero va `eager`.

---

## 0. Modelo actual — paneles verticales (prioridad diseñador)

El hero es un **strip** de columnas: 1 panel CTA (solo tipografía CSS, sin foto) + **4 paneles con foto vertical**.

| Asset | Tamaño canvas | Ratio | Cantidad | Peso |
| --- | --- | --- | --- | --- |
| **Panel foto** | **800 × 1200 px** | **2:3** vertical | **4** | WebP ≤ ~180 KB c/u |
| Master layout (opcional) | 1920 × 720 px | ~8:3 | 1 | Solo referencia de composición |

### Qué va en la imagen vs en HTML

| En la foto | En HTML (no quemar) |
| --- | --- |
| Escena / producto / almacén / gente | Título del panel (mayúsculas) |
| Ambiente visual | Pill partido rojo/gris |
| — | CTA «Descargar PDF» del panel oscuro |

### Zona segura

- Sujeto principal en el **75% superior**.
- El **25% inferior** se oscurece con degradado y lleva título + pill.
- Sin texto quemado en la imagen.

### Colores del pill (referencia)

| Mitad | Hex | Token |
| --- | --- | --- |
| Izquierda | `#E30613` texto blanco | `rosver-red` |
| Derecha | `#F3F4F6` texto `#0D0D0D` | `rosver-soft` / `rosver-ink` |

### Nombres sugeridos de archivo

`hero-panel-01.webp` … `hero-panel-04.webp`

Código: `HeroWaveSlider` + `HERO_PANEL_DESIGNER_SPECS` en `home-hero-slides.ts`. Change: `0248` / `0259`.

---

## 1. Referencias históricas

| Referencia | Qué tiene | Qué tomamos |
| --- | --- | --- |
| **Katrina Imports** | Strip multipanel + pills bicolor + barra negra | **Modelo UI actual** (colores → Rosver) |
| **Grupo Shinán** | Texto quemado en flyer | Evitar texto quemado |
| **Chamo Import** | Foto + CTA HTML | Texto/CTA en HTML |

---

## 2. Medidas legacy (banner panorámico único — archivado)

Si en el futuro se vuelve a un banner full-bleed único por breakpoint:

| Breakpoint | Canvas | Aspecto |
| --- | --- | --- |
| Móvil | 750 × 1000 px | 3:4 |
| Tablet | 1024 × 768 px | 4:3 |
| Desktop | 1920 × 600 px | ~3.2:1 |

---

## 3. Implementación técnica

- `HeroWaveSlider`: paneles visibles 1 / 2 / 4 / 5 según ancho (CTA + 4 fotos); flechas; PDF vía `/api/catalog/pdf`.
- Datos: `HomeHeroPanel` en `home-hero-slides.ts`; CMS `home_hero` se mapea con `panelsFromCmsSlides`.
- Debajo: barra negra de valor + `BrandCarousel`.

### Histórico

- `HeroWaveSlider` ola grocery (rojo full-bleed) — reemplazado 2026-09-13 (0248).
- `HeroBannerGrid` / `HeroCarousel` — retirados antes.

## 4. Fila de marcas (`BrandCarousel`)

Logos individuales PNG/SVG, alto ~40–56px. No forman parte del strip del hero.

## 5. Checklist diseñador (modelo multipanel)

- [ ] 5 archivos **800 × 1200** WebP (`hero-panel-01` … `05`)
- [ ] Sin título ni pill quemados en la foto
- [ ] Sujeto en 75% superior; inferior libre/oscuro
- [ ] ≤ ~180 KB por archivo
- [ ] Temática Rosver (herramientas / almacén / despacho / catálogo)
