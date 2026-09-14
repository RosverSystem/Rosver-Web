# Cambio: Módulo Slider (antes Contenido) — hero editable

**Fecha:** 2026-09-14  
**Tipo:** feature

## Qué cambió

- El módulo admin **Contenido** pasa a llamarse **Slider** (`/admin/slider`; `/admin/contenido` redirige).
- CRUD de paneles del hero: imagen (R2 `slider/`), título, textos rojo/blanco de la pill, visible, orden.
- Cada panel puede vincularse a **categoría**, **subcategoría**, **producto** o enlace personalizado.
- Panel oscuro PDF editable (`ctaTitle`, `ctaLabel`) y **autoplay** configurable (`autoplayMs`).
- Home (`HeroWaveSlider`) lee el CMS, gira solo y mantiene flechas; pausa al hover / reduced motion.
- API `home_hero` con schema Zod ampliado + migración `044_home_hero_slider.sql`.

## Por qué

Rosa pidió renombrar Contenido → Slider y poder gestionar el carrusel del inicio (imágenes, textos, vínculos a catálogo) con giro automático y flechas.

## Cómo

Persistencia en `site_content.key = home_hero` (JSONB), sin tabla nueva. El admin resuelve `href` al guardar (`/catalogo/:slug` o `/producto/:slug`). Compat de slides viejos vía `coerceSlides` en la API.

## Archivos

- `RosverSac/server/src/routes/admin-content.ts`
- `RosverSac/server/sql/044_home_hero_slider.sql`
- `RosverSac/server/src/lib/upload-image.ts` / `admin-storage.ts` (carpeta `slider`)
- `RosverSac/src/features/admin-content/ui/AdminContentPage.tsx`
- `RosverSac/src/features/catalog/model/home-hero-slides.ts`
- `RosverSac/src/features/catalog/ui/HeroWaveSlider.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`, `App.tsx`
- `RosverSac/src/shared/ui/admin-media-picker.tsx`
- `docs/features/admin-content.md`, `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Login admin → menú **Slider** (no «Contenido»)
- [ ] Agregar panel, subir imagen, editar título + textos rojo/blanco, guardar
- [ ] Vincular a categoría / subcategoría / producto → en `/` el panel navega bien
- [ ] Autoplay ~5s; flechas manuales; hover pausa
- [ ] Editar título/botón del panel PDF y ver cambio en home
- [ ] Móvil / tablet / desktop: slider usable
- [ ] Deploy Railway responde en URL pública
