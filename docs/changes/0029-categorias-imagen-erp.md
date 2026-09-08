# 0029 — Categorías con imagen (preview) + modelo ERP

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `Category` ampliado: `id`, `imageUrl?`, `visible?`, `sortOrder?` (contrato hacia ERP).
- Mocks con fotos Unsplash por categoría (solo preview visual).
- `CategoryGrid` rediseñado: foto full-bleed + overlay + badge ícono; sin imagen → fallback color sólido.
- Grilla responsive 2 / 3 / 4 columnas; `loading="lazy"` en fotos.
- Admin categorías muestra miniatura y estado visible.
- Doc `docs/architecture/07-categorias-imagen-erp.md`.

## Por qué

Permitir ver cómo lucen las categorías con imagen y dejar el modelo listo para que un ERP / admin asigne `imageUrl` sin rehacer el UI.

## Cómo

- Imagen opcional: el componente no exige foto.
- Orden y visibilidad preparados (`sortOrder`, `visible`).
- Fotos externas mock; en producción se sustituyen por CDN/ERP (≤ ~640px, WebP preferible).

## Archivos

- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `docs/architecture/07-categorias-imagen-erp.md`
- `docs/architecture/02-producto-rosver-sac.md`
- `docs/features/catalog.md`
- `docs/README.md`

## Cómo verificar

- [ ] Home → sección “Compra por categoría”: tarjetas con foto + texto legible
- [ ] Hover: zoom suave de la imagen
- [ ] Quitar un `imageUrl` en mocks → esa tarjeta vuelve a color sólido + ícono
- [ ] `/admin/categorias` muestra miniaturas
- [ ] _(UI)_ Móvil 2 cols / tablet 3 / desktop 4
- [ ] _(UI)_ Lazy load; sin layout jump (aspect 4/3)
