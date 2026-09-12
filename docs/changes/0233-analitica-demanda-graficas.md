# Cambio: Analítica de demanda + gráficas ERP

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- Migración `038_product_analytics.sql`: `view_count` / `order_count` / `quote_count` + `product_metrics_daily`.
- Pedido/cotización → `order_count` / `quote_count` (match por slug o nombre; auto-sync al abrir analítica)
- Serie diaria rellenada desde historial de pedidos/cotizaciones
- Vistas no bloquean por Redis lento
- Tendencia prioriza productos con demanda real

- Módulo `/admin/analitica`: KPIs, línea, donut, histogramas (SVG + GSAP).
- Feature `admin-analytics` + doc flujo `08-analitica-demanda.md`.

## Por qué

Hacer funcionales «productos en tendencia» y tops con datos reales, y un panel de analítica entendible.

## Cómo

Contadores desnormalizados + serie diaria; sin librería de charts pesada (SVG propio + GSAP).

## Archivos

- `RosverSac/server/sql/038_product_analytics.sql`
- `RosverSac/server/src/lib/product-analytics.ts`
- `RosverSac/server/src/routes/admin-analytics.ts`
- `RosverSac/server/src/routes/catalog.ts` / `orders.ts` / `quotes.ts`
- `RosverSac/src/features/admin-analytics/**`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`, `TrendingProducts.tsx`
- `docs/features/admin-analytics.md`, `docs/logica-y-flujos/08-analitica-demanda.md`

## Cómo verificar

- [ ] Abrir `/admin/analitica` (admin) → KPIs con vistas/pedidos/cotiz. reales (auto-sync)
- [ ] Gráfica lineal con pedidos históricos por día (no solo hoy)
- [ ] Abrir ficha producto → sube vista; tendencia prioriza productos con demanda
- [ ] Cotizaciones con slug corto (`taladro`) matchean producto real por nombre/prefijo
- [ ] Móvil / tablet / desktop
- [ ] Carga aceptable
