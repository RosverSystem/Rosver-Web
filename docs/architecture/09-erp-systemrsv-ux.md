# ERP SystemRSV — guía UX/UI

Nombre del panel: **SystemRSV** (gestión). Sitio público: **Rosver** (catálogo).

## Objetivo visual

Composición tipo dashboard bento:

1. **Sidebar** estrecha oscura (`rosver-ink`) solo con iconos (+ tooltips / labels en expand móvil).
2. **Top bar** clara: saludo personalizado, reloj, búsqueda global de módulos, menú cuenta.
3. **Workspace** gris suave (`rosver-soft`) con cards blancas muy redondeadas.

Paleta oficial: `docs/architecture/06-paleta-colores.md`. CTA = rojo Rosver (no azul pastel del mock genérico).

## Módulos previstos (ecommerce importador)

| Módulo | Ruta | Rol |
| --- | --- | --- |
| Dashboard | `/admin` | KPIs pedidos, cotizaciones, stock |
| Productos | `/admin/productos` | CRUD catálogo + visibilidad web |
| Categorías | `/admin/categorias` | Taxonomía |
| Pedidos | `/admin/pedidos` | Flujo comercial |
| Cotizaciones | `/admin/cotizaciones` | Inbox B2B |
| Leads | `/admin/leads` | Contacto / captación |
| Contenido web | `/admin/contenido` | Banners / home |
| Usuarios | `/admin/usuarios` | RBAC |
| (futuro) Inventario / precios | TBD | Stock mayorista |

## Componentes de shell

- `AdminShell` + sidebar + top bar en `RosverSac/src/app/layout/admin/`.
- No reutilizar `PublicNavbar` / `Footer` en admin.

## Responsive

- Desktop: sidebar fija + top bar.
- Tablet/móvil: sidebar colapsable / rail inferior o drawer; top bar con search compacto.
- Targets ≥ 44px.

## Relación con reglas

- `13-erp-systemrsv-ux` (Cursor/Claude)
- `09-paleta-colores`, `03-responsive-ui`, `07-icons-cssvg`, `10-form-toasts`
