# Cambio: Analítica UI — diseño y gráficas animadas

**Fecha:** 2026-09-12  
**Tipo:** fix

## Qué cambió

- Header Analítica con gradiente suave y selector de días tipo pills.
- KPIs con acento de color + count-up GSAP; Top 1 en card oscura.
- Línea: área rellena, puntos, dash animado por longitud real.
- Donut: solo demanda (vistas/pedidos/cotiz.); centro HTML (sin texto tapado); % por segmento.
- Histogramas con rank badge, gradiente y entrada escalonada.

## Por qué

La vista se veía plana; el donut tapaba «Mix» y las reseñas dominaban el gráfico.

## Cómo

SVG + GSAP (sin lib de charts). Paleta Rosver.

## Archivos

- `RosverSac/src/features/admin-analytics/ui/AdminAnalyticsPage.tsx`
- `…/AnalyticsLineChart.tsx`, `AnalyticsDonutChart.tsx`, `AnalyticsBarChart.tsx`

## Cómo verificar

- [ ] `/admin/analitica`: animaciones al cargar (KPI + secciones + gráficas)
- [ ] Donut legible, sin texto cortado; sin reseñas en el mix
- [ ] Línea con área y puntos en días con datos
- [ ] Móvil / tablet / desktop
- [ ] `prefers-reduced-motion` sin forzar motion
