# Cambio: SKU numérico en especificaciones (00000000)

**Fecha:** 2026-09-11  
**Tipo:** feature

## Qué cambió

- El SKU de tipos de especificación es un **código interno de 8 dígitos** (`00000000`, `00000001`…), igual que productos y presentaciones.
- Al crear, el modal muestra de antemano el SKU que se asignará (preview `next-code`).
- Migración `034_spec_attributes_internal_code.sql`.

## Por qué

El SKU no debía ser un slug del nombre ni un guion: debe ser el código serial del sistema.

## Cómo

- Columna `internal_code` + secuencia en Postgres.
- `GET /api/admin/spec-attributes/next-code` para preview sin consumir la secuencia.
- UI con `formatInternalCode`; la `key` técnica (slug) sigue existiendo solo para seeds/joins internos.

## Archivos

- `RosverSac/server/sql/034_spec_attributes_internal_code.sql`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminSpecsPage.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API + aplicar migración `034`
- [ ] `/admin/especificaciones` → Nueva: SKU muestra `0000000N` (no «—» ni slug)
- [ ] Crear y ver el mismo código en el listado
- [ ] _(UI)_ Móvil / tablet / desktop
