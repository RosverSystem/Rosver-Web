# Carrito — lógica tienda

**Estado:** lógica cliente (localStorage) · v0.1.30+  
**Código:** `RosverSac/src/features/cart/`

## Modelo

```
Línea = productSlug + packagingId? + quantity + unitPrice (congelado al agregar)
```

- Clave de línea: `slug` o `slug::packagingId` (misma presentación se acumula).
- Precio: empaque default (oferta → lista → `product.price`) vía `addInputFromProduct`.
- Persistencia: `localStorage` clave `rosver.cart.v1`.
- Sin seed mock: carrito inicia vacío (evita “14 unidades” fantasma vs lista vacía).

## Flujos

1. **Agregar** (card / ficha / buscador carrito / ofertas) → `addItem(addInputFromProduct(...))`.
2. **Cantidad −** a 0 → elimina la línea.
3. **Sync catálogo** (`CartCatalogSync` en layout público): quita líneas cuyo slug ya no está en `/api/catalog`.
4. **Cotizar** (`/cotizar`) lee `useCart().lines` y puede `replaceAll` al sincronizar ítems.
5. **Pedir** → `/login` (pedido autenticado, fase siguiente).

## UI `/carrito`

- Banner cuenta solo ítems **resolubles** en el catálogo actual.
- Subtotal estimado + TC referencial mock.
- Vaciar / cotizar / seguir comprando.
- **Continuar pedido** → modal: datos negocio + **Descargar PDF** (plantilla tipo factura) o **WhatsApp** (descarga PDF + chat con resumen; WA no adjunta PDF por enlace).

## Fuera de alcance (aún)

- Pedido real / stock / precios servidor al checkout.
- Selector de presentación dentro de la fila del carrito (sí en ficha producto).
