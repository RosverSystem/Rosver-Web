# Cambio: Módulo Clientes + interés de productos

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Migración `039_user_product_views.sql`.
- Track de vistas con `user_id` cuando hay sesión.
- API `GET /api/admin/clients` y `/clients/:id`.
- UI `/admin/clientes` (listado) y `/admin/clientes/:id` (detalle, frecuentes, últimos vistos, WhatsApp/email oferta).
- Doc flujo `09-clientes-interes-ofertas.md`.

## Por qué

Permitir al comercial ver qué buscan los clientes y contactarlos con ofertas relevantes.

## Cómo

Tabla de interés por usuario + match sesión en `POST …/view`; CRM liviano en admin.

## Archivos

- `RosverSac/server/sql/039_user_product_views.sql`
- `RosverSac/server/src/lib/admin-clients.ts`, `product-analytics.ts`
- `RosverSac/server/src/routes/admin-clients.ts`, `catalog.ts`, `index.ts`
- `RosverSac/src/features/admin-clients/**`
- `docs/features/admin-clients.md`, `docs/logica-y-flujos/09-…`

## Cómo verificar

- [ ] `npm run db:migrate` (039)
- [ ] Login cliente → abrir 2–3 productos → filas en interés
- [ ] Admin → Clientes → Ver detalles → tabs + WhatsApp
- [ ] Móvil / tablet / desktop
