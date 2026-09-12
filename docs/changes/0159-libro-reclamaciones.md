# Cambio: Libro de reclamaciones digital (Perú)

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Nueva vista `/libro-reclamaciones` con formulario alineado a estándares peruanos (reclamo/queja, datos consumidor, bien, detalle, pedido; menores con apoderado).
- Persistencia en Postgres (`014_consumer_complaints.sql`) con código `REC-AAAA-######`.
- Enlace + logo en footer (Contacto).
- ERP `/admin/reclamaciones`: listar, marcar en revisión, responder, archivar.
- API pública `POST/GET /api/complaints` y admin `GET/PATCH /api/admin/complaints`.

## Por qué

Pedido de Rosa: libro de reclamaciones en footer, formulario propio Rosver y guardado en base de datos.

## Cómo

- Feature `complaints-book`; proveedor prellenado desde `ROSVER_COMPANY`.
- Soft-flujo de estados (sin borrado físico por trazabilidad).

## Archivos

- `RosverSac/server/sql/014_consumer_complaints.sql`
- `RosverSac/server/src/routes/complaints.ts`
- `RosverSac/server/src/index.ts`
- `RosverSac/src/features/complaints-book/**`
- `RosverSac/src/app/App.tsx`, `Footer.tsx`, `admin-nav.ts`
- `RosverSac/public/libro-reclamaciones.png`
- `docs/features/complaints-book.md`, `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Footer → logo Libro de reclamaciones → formulario
- [ ] Registrar hoja → código REC-… y fila en DB
- [ ] `/admin/reclamaciones` lista y responde
- [ ] _(UI)_ Móvil / tablet / desktop
- [ ] Migración `014` aplicada en boot
