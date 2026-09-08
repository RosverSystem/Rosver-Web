---
description: CRUD completo obligatorio para tablas/módulos de datos (admin + API)
alwaysApply: true
---

# CRUD completo (tablas y funciones de datos)

Paridad Cursor ↔ Claude.

## Regla de oro

Al trabajar un **módulo o tabla** de negocio (marcas, categorías, productos, precios, pedidos, etc.):

1. **Create** — alta desde UI admin + `POST` API + validación Zod + toasts.
2. **Read** — listado usable (cards/filas ERP) + `GET` API.
3. **Update** — editar en UI + `PATCH`/`PUT` API.
4. **Delete** — eliminar o desactivar (soft) con confirmación clara + `DELETE` o `visible=false`.
5. Si hace falta esquema → migración `server/sql/NNN_*.sql` en la **misma** tarea (regla `15`).

No dejar solo “crear + listar vacío”. No dejar endpoints huérfanos sin pantalla ni pantallas sin API.

## Vínculos tienda

Lo que se crea en admin y debe verse en la web (inicio, menú, filtros, catálogo) se **conecta al mismo dato** (`/api/catalog` + provider). No duplicar mocks aparte sin documentar.

## Anti-patrones

- Solo INSERT sin editar/borrar.
- Tabla en Postgres sin rutas admin.
- UI de alta sin campos requeridos por la vista pública.
- “Próximamente” eterno en módulos ya pedidos.

## Checklist

- [ ] C/R/U/D (o soft-delete) cubiertos
- [ ] Migración si aplica
- [ ] Tienda / filtros / nav actualizados si el dato es público
- [ ] Change + pendientes
