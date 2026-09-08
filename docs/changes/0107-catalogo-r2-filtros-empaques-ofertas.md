# Cambio: Catálogo completo — R2, filtros subcats, empaques, ofertas, unidades

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.15

## Qué cambió

- Upload R2 admin (`POST /api/admin/uploads`) para categorías, marcas y productos.
- UI: imagen categoría, logo marca, foto producto + ficha editable (origen, MOQ, descripción, specs).
- Seed categorías demo + subcategorías (`007_categories_home_seed.sql`).
- Filtro de catálogo: raíz incluye productos de subcategorías; panel muestra hijos.
- Mega-menú «Ver categorías» en columnas con imagen/tagline.
- Carrito y ficha: selector de presentación (`packagingId` + precio unitario).
- Catálogo público: empaques, specs y precio `offer` en payload.
- Admin: página Unidades (`/admin/unidades`), Ofertas listando `price_kind=offer` / compare_at.
- Specs: `GET /spec-attributes` + `PUT /products/:id/specs`.

## Por qué

Cerrar pendientes de catálogo (categorías/marcas/productos/filtros) para un flujo coherente admin ↔ tienda.

## Cómo

Reutiliza patrón R2 de avatar; empaques/precios ya existían en admin; storefront ahora los consume. Ofertas admin es vista agregada (alta de precio sigue en producto).

## Archivos

- `RosverSac/server/sql/007_categories_home_seed.sql`
- `RosverSac/server/src/lib/upload-image.ts`, `catalog-products.ts`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/shared/ui/admin-image-upload.tsx`
- `RosverSac/src/features/admin-catalog/ui/*`
- `RosverSac/src/features/catalog/**`, `cart/**`
- `RosverSac/src/app/layout/PublicNavbar.tsx`, `admin/admin-nav.ts`, `App.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Deploy aplica `007` (categorías demo en `/admin/categorias`)
- [ ] Subir imagen en categoría / logo en marca / foto en producto
- [ ] `/catalogo/herramientas` lista también productos de subcategorías
- [ ] Mega-menú desktop con columnas e imágenes
- [ ] Ficha: elegir presentación → carrito muestra label y precio
- [ ] `/admin/ofertas` y `/admin/unidades` útiles
- [ ] `/ofertas` refleja precios offer / compare_at
- [ ] Móvil / tablet / desktop
- [ ] Carga aceptable (lazy en thumbs)
