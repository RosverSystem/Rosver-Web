# Cambio: Reclamaciones admin — tabla Bootstrap

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- `/admin/reclamaciones`: tabla Bootstrap (código, consumidor, tipo reclamo/queja, fecha, estado).
- Buscador en vivo, filtros tipo/estado, paginación, badges de color.
- Iconos: ver, responder, eliminar.
- Modal XL con detalle completo + respuesta del proveedor.
- `DELETE /api/admin/complaints/:id`.

## Archivos

- `RosverSac/src/features/complaints-book/ui/AdminComplaintsPage.tsx`
- `RosverSac/src/shared/lib/complaint-pipeline.ts`
- `RosverSac/server/src/routes/complaints.ts`
- `docs/changes/0207-reclamaciones-tabla-bootstrap.md`

## Cómo verificar

- [ ] Reiniciar API (DELETE nuevo).
- [ ] `/admin/reclamaciones`: tabla aunque esté vacía (mensaje claro).
- [ ] Con hojas: buscar, filtrar, ver modal, responder, eliminar.
- [ ] Móvil / tablet / desktop.
