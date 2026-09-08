# Flujo — ERP SystemRSV

## Acceso

```
Login admin → RequireAdmin → /admin (shell SystemRSV)
```

## Shell

- Sidebar: navegación por módulos.
- Top bar: saludo (primer nombre), hora Lima/local, búsqueda de módulos, menú Mi cuenta (logout).
- Contenido: `<Outlet />` por ruta.

## Productos (fase actual)

- Ruta `/admin/productos` montada.
- Vista **vacía** (placeholder) hasta CRUD real + API.
- No listar mocks wireframe en el ERP nuevo estilo.

## Datos futuros

API bajo `/api/admin/*` + Postgres; media en R2. Ver skill `fullstack-erp-structure`.
