# Cambio: Pedido con destino/agencia + fix API orders

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Continuar pedido vuelve a pedir **ubicación destino** (dirección + ubigeo) y **agencia**, igual que cotizar.
- Migración `024_order_ship_agency.sql` + API `POST /api/orders` guarda esos campos.
- El error «No encontrado» venía de la API local sin reiniciar (ruta `/api/orders` no cargada).
- Modal Continuar pedido más ancho (`max-w-2xl` / `sm:max-w-3xl`).

## Por qué

Se había quitado destino/agencia por un malentendido del pedido anterior; el usuario sí los necesita en el pedido. El 404 era proceso API viejo.

## Cómo

Mismos componentes que cotizar (`PeruAddressSuggest` + agencia). Reinicio de `dev:api` tras migrar.

## Archivos

- `RosverSac/server/sql/024_order_ship_agency.sql`
- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `RosverSac/src/features/cart/ui/PublicOrderPage.tsx`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`

## Cómo verificar

- [ ] Modal Continuar pedido muestra dirección/ubigeo + agencia
- [ ] Generar PDF guarda pedido sin «No encontrado»
- [ ] Admin `/admin/pedidos` muestra destino/agencia
- [ ] Móvil / tablet / desktop: modal scrollea bien
