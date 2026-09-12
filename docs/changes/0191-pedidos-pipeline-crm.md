# Cambio: Pedidos admin — pipeline CRM 5 fases

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- `/admin/pedidos` pasa de tabla a **pipeline CRM** (columnas por fase).
- Estados: Confirmación de pedido → Confirmación de pago → Realizando envío → Enviado → Entregado.
- Migración `025_order_pipeline_status.sql` (`order_requests.status`).
- API: `GET /api/admin/orders` incluye `status`; `PATCH /api/admin/orders/:id` cambia fase.
- Cuenta cliente: mismos 5 estados en stepper/filtros (mocks + local).

## Por qué

Pedido de Rosa: ver pedidos como pipeline de CRM con esas fases, no solo listado plano.

## Cómo

Kanban horizontal (scroll en móvil); cards con Avanzar / Ver; modal con select de fase. Default al crear: `confirmacion_pedido`.

## Archivos

- `RosverSac/server/sql/025_order_pipeline_status.sql`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/src/shared/lib/order-pipeline.ts`
- `RosverSac/src/shared/ui/status-stepper.tsx`
- `RosverSac/src/features/account/model/mocks.ts`
- `RosverSac/src/features/account/model/local-orders.ts`
- `RosverSac/src/features/account/ui/AccountOrdersPage.tsx`
- `docs/changes/0191-pedidos-pipeline-crm.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Migración 025 aplicada (`npm run db:migrate`)
- [ ] `/admin/pedidos`: 5 columnas; pedido existente en «Confirmación de pedido»
- [ ] Botón **Avanzar fase** mueve a la siguiente columna
- [ ] Modal: cambiar fase con el select
- [ ] Móvil: scroll horizontal del pipeline
- [ ] Tablet / desktop: columnas en fila
- [ ] `/cuenta/pedidos`: stepper con 5 fases
