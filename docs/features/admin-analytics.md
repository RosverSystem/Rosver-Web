# Feature: admin-analytics (SystemRSV)

**Slug:** `features/admin-analytics/`  
**Estado:** activa

## Propósito

Guardar y mostrar métricas de demanda (vistas, pedidos, cotizaciones, valoraciones) para tops, tendencia de tienda y gráficas ERP.

## Alcance

- Incluido: contadores en `products`, rollup diario, track de vista en ficha, bump al crear pedido/cotización, `/admin/analitica` con línea / donut / histogramas (GSAP).
- Fuera: Google Analytics, heatmaps, funnel multipágina.

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `AdminAnalyticsPage` | página | Panel `/admin/analitica` |

## APIs HTTP

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/catalog/products/:slug/view` | +1 vista (tienda) |
| `GET` | `/api/admin/analytics?days=` | KPIs + tops + serie |
| `POST` | `/api/admin/analytics/rebuild-demand` | Recalcular pedidos/cotiz. desde historial |

## Dependencias

- `shared/`: api, gsap, toasts
- Catálogo / pedidos / cotizaciones (solo vía API)

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/admin/analitica` | `AdminAnalyticsPage` | Admin |

## Verificación

- [ ] Abrir ficha producto → `view_count` sube (1 vez por pestaña)
- [ ] Pedido/cotización → `order_count` / `quote_count`
- [ ] `/admin/analitica` muestra KPIs y gráficas
- [ ] Tendencia home usa score de demanda si no hay `trending` manual
