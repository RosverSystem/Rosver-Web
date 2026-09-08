---
description: Migraciones Postgres en cada cambio de producto/API que las requiera
alwaysApply: true
---

# Base de datos continua (Postgres)

Paridad Cursor ↔ Claude. **No dejar el esquema atrasado** respecto al código.

## Regla de oro

Si un cambio de feature, API o ERP **necesita** tablas, columnas, índices o datos semilla:

1. Crear o ampliar migración en `RosverSac/server/sql/NNN_slug.sql` (siguiente número: `001`, `002`, `003`…).
2. SQL **idempotente** cuando se pueda (`IF NOT EXISTS`, `ON CONFLICT`).
3. Aplicar vía `migrate.ts` (ya corre todos los `NNN_*.sql` ordenados en boot Railway).
4. Actualizar rutas Hono / seed si aplica.
5. Documentar en `docs/changes/NNNN-*.md` y, si cambia el modelo de dominio, en `docs/logica-y-flujos/` o `docs/architecture/`.

## Cuándo sí migrar (en el mismo pedido)

- Nuevo módulo con entidades persistentes (marcas, precios, pedidos…).
- Campos nuevos en UI/API que deben guardarse.
- Cambios de relación (FK), constraints o índices de rendimiento necesarios.
- Seeds mínimos para que admin/tienda no queden vacíos sin sentido.

## Cuándo no

- Solo CSS / copy / layout sin datos nuevos.
- Mocks visuales explícitos sin persistencia todavía (anotar en `PENDIENTES.md`).

## Anti-patrones

- UI/API que asume columnas que no existen en Postgres.
- Editar solo `002_*.sql` ya desplegado de forma incompatible: preferir **nuevo** `003_*.sql` alter.
- SQL solo en el chat sin archivo en `server/sql/`.
- Secretos o `DATABASE_URL` en el repo.

## Checklist al cerrar

- [ ] Archivo `server/sql/NNN_*.sql` si el cambio lo requiere
- [ ] `migrate` / boot aplica sin error
- [ ] Change + pendientes actualizados
- [ ] Push `main` + deploy Railway (regla `11`)
