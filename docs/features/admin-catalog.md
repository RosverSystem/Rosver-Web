# Feature: admin-catalog (SystemRSV)

**Slug:** `features/admin-catalog/`  
**Estado:** activa (v1.1 taxonomía live + home)

## Propósito

Gestión ERP del catálogo: marcas, categorías/subcategorías, productos (ficha CRM), presentaciones, **tipos de especificaciones técnicas**, empaques y precios.

## Alcance

- Incluido: CRUD marcas/categorías; productos ficha CRM; presentaciones; **especificaciones** (`/admin/especificaciones`); empaques/precios; API admin + `/api/catalog`.
- Fuera: import CSV, stock físico, sync ERP externo.

## API pública

| Export | Descripción |
| --- | --- |
| `AdminProductsPage` | Listado productos |
| `AdminProductWorkspacePage` | Ficha CRM alta/edición |
| `AdminPriceListPage` | Presentaciones |
| `AdminSpecsPage` | Tipos de especificación técnica |
| `AdminCategoriesPage` | CRUD categorías |
| `AdminBrandsPage` | CRUD marcas |
| `AdminOffersPage` | Ofertas |

## Pantallas

| Ruta | Notas |
| --- | --- |
| `/admin/productos` | Listado |
| `/admin/productos/nuevo` · `/:id` | Ficha CRM |
| `/admin/listado-precios` | Presentaciones |
| `/admin/especificaciones` | Tipos de ficha técnica (defaults sistema protegidos) |
| `/admin/categorias` | Categorías |
| `/admin/marcas` | Marcas |
| `/admin/ofertas` | Ofertas |

## Verificación

- [ ] Migraciones hasta `032` aplicadas
- [ ] Especificaciones: listar defaults + crear personalizada
- [ ] Crear producto → empaque → precio lista
- [ ] Con taxonomía en DB, `/api/catalog` trae `liveCategories` / `liveBrands`
