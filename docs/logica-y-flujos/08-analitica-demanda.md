# Analítica de productos — lógica

**Estado:** implementado (v0.1.45)  
**UI tienda:** tendencia + ranking  
**UI ERP:** `/admin/analitica`

## Qué se guarda

| Métrica | Dónde | Cuándo |
| --- | --- | --- |
| Vistas | `products.view_count` + `product_metrics_daily.views` | `POST …/products/:slug/view` (1/sesión en front) |
| Pedidos (u.) | `order_count` + daily `orders` | Al crear `order_requests` (líneas product) |
| Cotizaciones (u.) | `quote_count` + daily `quotes` | Al crear `quote_requests` |
| Valoración | `rating` / `review_count` | Calificaciones públicas (037) |

## Score de tendencia

```
LN(views+1)*2 + LN(orders+1)*3 + LN(quotes+1)*2.5 + rating*LN(reviews+1)
```

Si hay productos con `trending=true`, esos mandan (orden manual). Si no, este score.

## Top 1

Producto con mayor score de tendencia (visible en KPIs de analítica).

## Rebuild

`POST /api/admin/analytics/rebuild-demand` relee JSONB de pedidos/cotizaciones y recalcula contadores.
