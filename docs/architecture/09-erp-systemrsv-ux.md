# ERP SystemRSV — guía UX/UI

## Modelo visual

SaaS soft colapsable (paleta Rosver):

- Sidebar blanca expandible/colapsable.
- **Perfil solo al pie del sidebar** (evitar duplicar en top bar).
- Top bar: título de página + búsqueda + hora.
- Activo: rojo Rosver.

Skill: `erp-systemrsv-saas-ux`.

## Módulos nav

| Ítem | Ruta |
| --- | --- |
| Inicio | `/admin` |
| Almacenamiento | `/admin/almacenamiento` (R2, preview modal) |
| Catálogo → Presentaciones | `/admin/listado-precios` |
| Catálogo → Especificaciones | `/admin/especificaciones` (tipos de ficha técnica) |
| Catálogo → Productos | `/admin/productos` (listado); ficha CRM `/admin/productos/nuevo` · `/admin/productos/:id` |
| Catálogo → Presentaciones | `/admin/listado-precios` (tipos de unidad + cantidades) |
| Catálogo → Categorías | `/admin/categorias` |
| Catálogo → Marcas | `/admin/marcas` |
| Catálogo → Ofertas | `/admin/ofertas` |

## Layout estático

- Shell `h-dvh overflow-hidden`; solo el `main` hace scroll.
- Sidebar y top bar no se mueven con el contenido.
- Lenis (scroll suave) **desactivado** en `/admin`.

## Formularios

- Alta/edición en **`AdminModal`** (regla `17-erp-forms-modal`). Excepción **Productos**: ficha CRM de página completa. Listado + CTA en la página; no forms inline permanentes en el resto de módulos.
- No aplica a la tienda pública.
- Selects: `AdminSelect` (regla `14`).
