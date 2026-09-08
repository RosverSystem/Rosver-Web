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
| Catálogo → Productos | `/admin/productos` |
| Catálogo → Listado de precios | `/admin/listado-precios` (unidades + presentaciones) |
| Catálogo → Categorías | `/admin/categorias` |
| Catálogo → Marcas | `/admin/marcas` |
| Catálogo → Ofertas | `/admin/ofertas` |

## Layout estático

- Shell `h-dvh overflow-hidden`; solo el `main` hace scroll.
- Sidebar y top bar no se mueven con el contenido.
- Lenis (scroll suave) **desactivado** en `/admin`.
