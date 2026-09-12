# Cambio: Reset prod DB + admin acosta.wp076@gmail.com

**Fecha:** 2026-09-12  
**Tipo:** chore | fix

## Qué cambió

- Vacío datos de negocio en Postgres producción (catálogo, pedidos, sesiones, users, site_content).
- Admin único: `acosta.wp076@gmail.com` (rol `admin`), con `SEED_SKIP_CLIENT=1`.
- `migrate.ts` ahora registra migraciones en `_schema_migrations` (no re-ejecuta seeds SQL en cada boot).
- `SEED_ADMIN_EMAIL` / password actualizados en Railway.

## Por qué

Pedido: borrar todos los datos y dejar una sola cuenta admin.

## Cómo

Script `reset-production-data.ts --apply` vía TCP proxy Railway; seed local con vars de prod; push + redeploy para que boot no re-siembre catálogo.

## Archivos

- `RosverSac/server/scripts/reset-production-data.ts`
- `RosverSac/server/src/migrate.ts`
- `RosverSac/server/src/seed.ts`
- `docs/changes/0241-reset-db-admin-acosta.md`

## Cómo verificar

- [x] Login en https://rosversac.com/login con el correo admin
- [x] Solo 1 usuario `acosta.wp076@gmail.com` rol `admin`
- [x] Catálogo vacío (0 products / brands / categories)
- [x] `_schema_migrations` con 42 entradas (no re-siembra en boot)
- [ ] Rosa confirma login en `/admin`
