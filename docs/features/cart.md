# Feature: Carrito

**Slug:** `features/cart/`  
**Estado:** activa (lógica cliente + API pedido)

## Propósito

Armar un carrito de productos para pasar a **cotización** (`/cotizar`) o **pedido** (Continuar pedido).

## Alcance

- Incluido: añadir/quitar/cantidad, presentación + precio, `localStorage`, sync catálogo, `/carrito`, modal Continuar pedido → destino + agencia + `order_requests` + PDF + link `/p/…` 15 días + WhatsApp corto.
- Fuera: pagos, stock real, adjunto PDF automático en WhatsApp (limitación de plataforma).

## Distinción

| Flujo | Tabla | Link público |
| --- | --- | --- |
| Cotizar | `quote_requests` | `/c/:slug` |
| Continuar pedido (carrito) | `order_requests` | `/p/:slug` |

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `CartProvider` | provider | Montar en `App` |
| `useCart` | hook | `lines`, `itemCount`, `addItem`, … |
| `PublicOrderPage` | página | `/p/:slug` |
| `ContinueOrderModal` | UI | Modal desde `/carrito` |

## Persistencia pedido

- Migración `023_order_requests.sql`
- `POST /api/orders`, `PUT /api/orders/:id/pdf`, `GET /api/orders/public/:slug`

## Verificación

- [x] Continuar pedido sin copy de ayuda ni ciudad/agencia
- [x] Pedido en DB + link 15 días + WA abreviado
- [ ] Listado cuenta `/cuenta/pedidos` desde API (aún local + P03)
