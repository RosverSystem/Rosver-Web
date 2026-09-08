# Cambio: CRUD categorías/marcas + inicio desde DB

**Fecha:** 2026-09-08  
**Tipo:** feature

## Qué cambió

- Nueva regla **16-crud-completo**: todo módulo/tabla con Create + Read + Update + Delete (o soft-delete) y vínculo a tienda si es público.
- Migración `003_category_home_fields.sql`: `tagline`, `highlight_points`, `show_on_home` en `categories`.
- Admin categorías: CRUD completo + campos para card de inicio (etiqueta, 3 puntos, imagen, menú/inicio).
- Admin marcas: editar y eliminar además de crear/listar.
- `/api/catalog` devuelve categorías y marcas desde DB aunque no haya productos; flags `liveCategories` / `liveBrands` / `liveProducts`.
- Tienda: `CatalogProvider` hidrata categorías/marcas/productos por separado; «Explora por categoría», menú y filtro de marcas usan DB.
- Versión app `0.1.11`.

## Por qué

Al agregar una categoría principal en admin debe aparecer en inicio, menú y filtros, pidiendo los datos que la card del home necesita. Empezar a operar con Postgres de verdad.

## Cómo

Misma fuente (`categories` / `brands`) para admin y `/api/catalog`. Validación server-side si `show_on_home`: exige tagline, ≥1 punto e imagen. Cliente mantiene mocks solo si la taxonomía DB está vacía.

## Archivos

- `.cursor/rules/16-crud-completo.mdc`, `.claude/rules/16-crud-completo.md`
- `RosverSac/server/sql/003_category_home_fields.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`, `catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`, `AdminBrandsPage.tsx`
- `RosverSac/src/features/catalog/model/catalog-store.tsx`, `mocks.ts`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`, `BrandCarousel.tsx`, `CatalogPage.tsx`
- `AGENTS.md`, `CLAUDE.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Deploy aplica migración `003` (boot `migrate`)
- [ ] Admin → Categorías: crear principal con «Mostrar en el inicio», etiqueta, 3 puntos, URL imagen
- [ ] Inicio → «Explora por categoría» muestra esa card
- [ ] Header → «Ver categorías» lista la categoría
- [ ] Catálogo → filtro categorías (y marcas si se crearon)
- [ ] Editar / eliminar categoría y marca funcionan
- [ ] Móvil / tablet / desktop: cards y form admin usables
- [ ] Sin productos en DB: categorías/marcas live; productos aún mocks
