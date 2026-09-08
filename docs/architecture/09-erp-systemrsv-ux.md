# ERP SystemRSV — guía UX/UI

Nombre del panel: **SystemRSV**. Sitio público: **Rosver**.

## Modelo visual (actual)

SaaS soft (referencia tipo EduNova layout, **paleta Rosver**):

- Sidebar blanca ancha con labels + iconos.
- Item activo: pill rojo Rosver.
- Top bar: search módulos (hint ⌘K) + perfil con menú (logout).
- Workspace: `bg-rosver-soft` + cards blancas redondeadas.

Skill: `erp-systemrsv-saas-ux` (Cursor / Claude).

## Módulos en nav (únicos)

| Ítem | Ruta | Estado |
| --- | --- | --- |
| Inicio | `/admin` | Placeholder vacío |
| Productos → Listado | `/admin/productos` | Placeholder vacío |
| Productos → Categorías | `/admin/categorias` | Placeholder vacío |
| Productos → Ofertas | `/admin/ofertas` | Placeholder vacío |

Otros módulos legacy (pedidos, leads, …) **fuera de nav** hasta nuevo pedido.

## Anti-patrones

- Azul primario del mock de referencia.
- Sidebar oscura solo-iconos.
- Navbar ecommerce dentro del ERP.
