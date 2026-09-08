# Carrito — lógica tienda

**Estado:** lógica cliente (localStorage) · v0.1.32+  
**Código:** `RosverSac/src/features/cart/`

## Modelo

```
Línea = productSlug + packagingId? + quantity + unitPrice (congelado al agregar)
```

- Clave de línea: `slug` o `slug::packagingId` (misma presentación se acumula).
- Precio: empaque default (oferta → lista → `product.price`) vía `addInputFromProduct`.
- Persistencia: `localStorage` clave `rosver.cart.v1`.
- Sin seed mock: carrito inicia vacío (evita “14 unidades” fantasma vs lista vacía).
- Badge navbar / banner: solo líneas cuyo `productSlug` existe en el catálogo vivo (`visibleCartItemCount`).

## Flujos

1. **Agregar** (card / ficha / buscador carrito / ofertas) → `addItem(addInputFromProduct(...))`.
2. **Cantidad −** a 0 → elimina la línea.
3. **Sync catálogo** (`CartCatalogSync` en layout público): quita líneas cuyo slug ya no está en `/api/catalog`.
4. **Cotizar** (`/cotizar`) lee `useCart().lines`; prefill datos si hay sesión.
5. **Continuar pedido** → modal (nunca redirige a `/login` si ya hay sesión):
   - Prefill nombre / documento / teléfono desde `useAuth`.
   - PDF + WhatsApp.
   - Si hay sesión: guarda pedido en `localStorage` (`rosver.local-orders.v1`) visible en `/cuenta/pedidos`.

## UI `/carrito`

- Banner cuenta solo ítems **resolubles** en el catálogo actual.
- Subtotal estimado + TC referencial mock.
- Vaciar / cotizar / seguir comprando.
- **Continuar pedido** → modal: datos negocio + **Descargar PDF** o **WhatsApp**.

## Fuera de alcance (aún)

- Pedido real / stock / precios servidor al checkout.
- Pedidos en Postgres (hoy local + mocks en cuenta).
- Selector de presentación dentro de la fila del carrito (sí en ficha producto).
