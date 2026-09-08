# Ofertas — ERP → tienda

**Estado:** vivo (Postgres) · v0.1.18  
**Vista tienda:** `/ofertas`  
**ERP:** `/admin/ofertas`

## Flujo

```
Admin /admin/ofertas
  · Alta producto nuevo o existente
  · Precio normal (list) + precio oferta (offer)
        ↓
product_prices (price_kind=list|offer, is_active)
        ↓
GET /api/catalog → offers[]
GET /api/catalog/offers
        ↓
OffersPage (solo DB, sin mocks)
```

## Reglas

1. Una oferta activa = fila `price_kind='offer'` activa (o lista con `compare_at > amount`).
2. En tienda el precio mostrado es el de **oferta**; el «Normal» es el precio lista.
3. Seed `008_offers_seed.sql`: RS-4201, RS-5402, RS-1042.
4. Quitar oferta = desactivar precios `offer` del producto (soft).

## Cómo agregar más

1. ERP → Ofertas → «Producto nuevo» o «Producto ya creado».
2. Precio normal > precio oferta.
3. Publicar → aparece en `/ofertas` tras refresh (o en ~45s).
