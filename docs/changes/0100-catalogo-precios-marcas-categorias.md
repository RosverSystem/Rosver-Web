# Cambio: Catálogo DB — precios por unidad, marcas, categorías

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.9

## Qué cambió

- Modelo Postgres `002_catalog_core`: marcas, categorías (árbol), unit_types, products, packagings, product_prices (guardar/modificar/como nuevo), spec_attributes/values.
- API admin: `/api/admin/brands|categories|unit-types|products|…/packagings|…/prices`.
- `/api/catalog` con `live: true` si hay productos.
- UI ERP: Marcas, Categorías, Listado con empaques + precios.
- Filtro tienda: **rango de precio**; valoración/disponibilidad/marca ya cableados.
- Topbar: categorías raíz + subcategorías desde `useCatalog`.
- Doc lógica: `docs/logica-y-flujos/04-catalogo-precios-unidades.md`.

## Por qué

Necesidad de listado de precios tipo marketplace (unidad → contenido → precio editable) + marcas/categorías vinculadas a filtros y nav.

## Cómo

Cascada documentada; precio con `saveAsNew` desactiva el anterior. Tienda sigue en mocks hasta que existan productos en DB.

## Archivos

- `RosverSac/server/sql/002_catalog_core.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`, `catalog.ts`, `migrate.ts`, `index.ts`
- `RosverSac/src/features/admin-catalog/ui/Admin{Brands,Categories,Products}Page.tsx`
- `RosverSac/src/features/catalog/**` (filtros, store, navbar)
- `docs/logica-y-flujos/04-*.md`, `docs/features/admin-catalog.md`, `docs/pendientes/`

## Cómo verificar

- [ ] Deploy aplica migración 002 (boot)
- [ ] `/admin/marcas` crear marca
- [ ] `/admin/categorias` raíz + sub
- [ ] `/admin/productos` producto → empaque ×10 → precio lista → modificar / guardar como nuevo
- [ ] `/catalogo` filtro rango precio + valoración
- [ ] Topbar Ver categorías muestra raíz/hijos (mocks o live)
- [ ] Móvil / tablet / desktop
