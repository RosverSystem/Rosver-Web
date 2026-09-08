# Feature: admin-catalog (SystemRSV)

**Slug:** `features/admin-catalog/`  
**Estado:** activa (v1.1 taxonomía live + home)

## Propósito

Gestión ERP del catálogo: marcas, categorías/subcategorías, productos, empaques (unidad×contenido) y precios editables con “guardar como nuevo”.

## Alcance

- Incluido: CRUD marcas/categorías (incl. campos home: tagline, puntos, imagen, show_on_home/nav); listado productos; empaques; upsert precios; API admin + `/api/catalog` (categorías/marcas live aunque no haya productos).
- Fuera: import CSV, stock físico, UI specs completa, selector empaque en carrito tienda, módulo ofertas ERP, upload R2 de imagen de categoría.

## API pública

| Export | Descripción |
| --- | --- |
| `AdminProductsPage` | Listado + panel precios |
| `AdminCategoriesPage` | CRUD + card inicio |
| `AdminBrandsPage` | CRUD marcas |
| `AdminOffersPage` | Placeholder ofertas |

## Pantallas

| Ruta | Notas |
| --- | --- |
| `/admin/productos` | Precios / empaques |
| `/admin/categorias` | Raíz + sub + campos Explora por categoría |
| `/admin/marcas` | Crear / editar / eliminar |
| `/admin/ofertas` | Vacío |

## Verificación

- [ ] Migraciones `002` + `003` aplicadas
- [ ] Crear marca → filtro tienda + marquee
- [ ] Crear categoría principal con inicio → card en home + menú
- [ ] Editar / eliminar categoría y marca
- [ ] Crear producto → empaque → precio lista
- [ ] Con taxonomía en DB, `/api/catalog` trae `liveCategories` / `liveBrands`
