# Cambio: Regla migraciones DB continuas

**Fecha:** 2026-09-08  
**Tipo:** docs

## Qué cambió

- Regla `15-database-migraciones` (Cursor + Claude, `alwaysApply`): si un cambio necesita persistencia, se crea/amplía `RosverSac/server/sql/NNN_*.sql` en la misma tarea.
- Punteros en `AGENTS.md`, `CLAUDE.md`, skills `fullstack-erp-structure` y `document-change`.
- Nota de migraciones en `docs/architecture/08-despliegue-y-almacenamiento.md`.

## Por qué

Mantener Postgres alineado al producto mientras se implementan features (no dejar el esquema “para después”).

## Cómo

Convención numerada existente (`001`, `002`, …); alter en archivos nuevos; boot ya aplica todas.

## Archivos

- `.cursor/rules/15-database-migraciones.mdc`
- `.claude/rules/15-database-migraciones.md`
- `AGENTS.md` / `CLAUDE.md`
- Skills document-change + fullstack-erp-structure
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Regla 15 visible en Cursor rules y espejo Claude
- [ ] Próximo módulo con datos nuevos añade `003_*.sql` (no solo UI)
