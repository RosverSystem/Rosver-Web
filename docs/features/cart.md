# Feature: Carrito

**Slug:** `features/cart/`  
**Estado:** activa (lógica cliente + UI)

## Propósito

Armar un carrito de productos para pasar a **cotización** o **pedido**.

## Alcance

- Incluido: añadir/quitar/cantidad, presentación + precio congelado, `localStorage`, sync con catálogo vivo, `/carrito`, CTAs cotizar/pedir, modal Continuar pedido (PDF + WhatsApp).
- Fuera: pagos, stock real, API pedido, adjunto PDF automático en WhatsApp (limitación de la plataforma).

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `CartProvider` | provider | Montar en `App` |
| `useCart` | hook | `lines`, `itemCount`, `addItem`, `syncWithCatalog`, … |
| `addInputFromProduct` | helper | Empaque default + precio al agregar |
| `CartCatalogSync` | UI | Montar bajo `CatalogProvider` (layout público) |
| `CartPage` | página | `/carrito` |
| `CartLine` | tipo | Línea persistida |

## Flujos

Ver `docs/logica-y-flujos/07-carrito.md` y `03-vistas-y-flujos.md` → F4.

## Verificación

- [ ] Carrito vacío: banner sin “N unidades”; buscador agrega producto real
- [ ] Agregar desde card/ficha/ofertas sube badge del navbar
- [ ] Recargar página mantiene ítems (localStorage)
- [ ] Productos borrados del catálogo desaparecen del carrito tras sync
- [ ] Cantidad − hasta 0 quita la línea; Vaciar limpia todo
- [ ] Cotizar precarga ítems del carrito
