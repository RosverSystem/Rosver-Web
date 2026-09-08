# Feature: admin-catalog (SystemRSV)

**Slug:** `features/admin-catalog/`  
**Estado:** activa (v1 precios / marcas / categorías)

## Propósito

Gestión ERP del catálogo: marcas, categorías/subcategorías, productos, empaques (unidad×contenido) y precios editables con “guardar como nuevo”.

## Alcance

- Incluido: CRUD básico marcas/categorías; listado productos; empaques; upsert precios; API admin + `/api/catalog` live.
- Fuera: import CSV, stock físico, UI specs completa, selector empaque en carrito tienda, módulo ofertas ERP.

## API pública

| Export | Descripción |
| --- | --- |
| `AdminProductsPage` | Listado + panel precios |
| `AdminCategoriesPage` | Árbol categorías |
| `AdminBrandsPage` | Marcas |
| `AdminOffersPage` | Placeholder ofertas |

## Pantallas

| Ruta | Notas |
| --- | --- |
| `/admin/productos` | Precios / empaques |
| `/admin/categorias` | Raíz + sub |
| `/admin/marcas` | SKU + code auto |
| `/admin/ofertas` | Vacío |

## Verificación

- [ ] Migración `002_catalog_core` aplicada
- [ ] Crear marca → aparece en listado
- [ ] Crear categoría raíz + sub
- [ ] Crear producto → empaque → precio lista → Modificar / Guardar como nuevo
- [ ] Con productos en DB, `/api/catalog` responde `live: true`
