# Feature: Admin — Slider (hero inicio)

**Slug:** `features/admin-content/`  
**Estado:** activa  
**Ruta:** `/admin/slider` (redirect desde `/admin/contenido`)

## Propósito

Editar el carrusel multipanel del inicio: imágenes, título, textos de la pill rojo/blanco, enlace a categoría / subcategoría / producto, y el panel PDF oscuro.

## Persistencia

- Tabla `site_content`, key `home_hero` (JSONB).
- Migración: `server/sql/044_home_hero_slider.sql`.
- API pública: `GET /api/content/home_hero`
- API admin: `GET|PATCH /api/admin/content/home_hero`
- Imágenes R2 carpeta `slider/`

## Campos del valor

| Campo | Uso |
| --- | --- |
| `ctaTitle` / `ctaLabel` | Panel oscuro + botón PDF |
| `autoplayMs` | Giro automático (0 = solo flechas) |
| `slides[]` | Paneles: `title`, `badgeLeft`, `badgeRight`, `imageUrl`, `linkType`, ids, `href`, `visible`, `sortOrder` |

## Flujos

`03-vistas-y-flujos.md` → F8 (contenido web / slider).

## Verificación

- [x] Nav admin «Slider» → `/admin/slider`
- [x] CRUD paneles + imagen + textos + vínculo catálogo
- [x] Home consume CMS con autoplay y flechas
