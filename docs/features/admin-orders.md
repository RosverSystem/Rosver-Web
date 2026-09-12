# Feature: Admin — pedidos

**Slug:** `features/admin-orders/`  
**Estado:** activa (listado + pipeline + evidencias)

## Propósito

Ver pedidos generados desde el carrito (Continuar pedido) y gestionar fases con evidencias del vendedor.

## Pantallas

| Ruta | Notas |
| --- | --- |
| `/admin/pedidos` | Tabla: código, cliente, fecha, fase + iconos |
| `/admin/pedidos/vista?codigo-pedido=&codcliente=` | Productos, pipeline, evidencias; FAB vuelve atrás |

## API

- `GET /api/admin/orders`
- `GET /api/admin/orders/by-code/:code` (ítems + evidencias)
- `PATCH /api/admin/orders/:id` `{ status?, paymentNote?, shipCarrier?, … }` — bloquea avance sin evidencia
- `POST /api/admin/orders/:id/evidence` multipart `kind`=`payment|voucher|delivery` + `file`
- `DELETE /api/admin/orders/:id`
- Creación pública: `POST /api/orders`

## Evidencias (R2)

Prefijo `orders/evidence/{orderId}/` — no usa carpetas de productos/marcas/perfil.

## Verificación

- [x] Listado + pipeline + productos en vista
- [x] Evidencias obligatorias por fase
- [ ] Ítems enriquecidos si el producto ya no está en catálogo (foto N/A OK)
