# Cambio: Vista previa tienda en producto y categoría (ERP)

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.28

## Qué cambió

- Modal de productos: panel «Vista previa en la tienda» con la misma `ProductCard` del catálogo (`preview`).
- Modal de categorías: preview de la card de inicio «Explora por categoría» (`CategoryHomeCard`).
- `CategoryHomeCard` extraída del carrusel home (misma UI en tienda y ERP).
- `ProductCard` acepta `preview` (sin links ni carrito).

## Por qué

Ver en el ERP cómo se verá en la web al editar nombre, foto, precios, tagline, etc.

## Cómo

Datos del formulario → objeto preview en vivo; componente de tienda reutilizado vía export público de `@/features/catalog`.

## Archivos

- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/CategoryHomeCard.tsx`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/index.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminWebPreview.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `RosverSac/package.json`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/productos` → Nuevo/Editar: a la derecha (o debajo en móvil) se actualiza la card al cambiar nombre, foto, marca, precios
- [ ] `/admin/categorias` → modal: preview de card inicio al editar tagline, puntos, imagen
- [ ] Si no «Mostrar en el inicio», aparece aviso bajo el preview
- [ ] Home `/` y catálogo: cards iguales (sin regresión)
- [ ] Móvil / tablet / desktop: preview usable en el modal
- [ ] Deploy Railway v0.1.28
