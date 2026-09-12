# Cambio: Inicio ERP — dashboard operativo

**Fecha:** 2026-09-12  
**Tipo:** feature

## Qué cambió

- API `GET /api/admin/dashboard` con KPIs (productos, clientes, pedidos/cotizaciones abiertas, reclamaciones, vistas), pedidos por fase, Top 1 tendencia y últimos 5 pedidos.
- Vista `/admin` (Inicio) rediseñada: cabecera SystemRSV, KPIs animados (GSAP), pipeline, top 1, recientes, accesos rápidos y tarjetas de **pendientes abiertos** con cómo abordarlos.
- Documentación de pendientes: resumen hecho vs abierto + cómo realizar lo que falta.

## Por qué

La pantalla Inicio solo enlazaba a Analítica. Rosa pidió revisar pendientes y un Inicio con diseño útil al entrar al ERP.

## Cómo

- Lib `server/src/lib/admin-dashboard.ts` + ruta en `admin-analytics.ts`.
- UI en `AdminDashboardPage` alineada al estilo SaaS de Analítica (tokens Rosver, cssvg-icons).
- Lista de pendientes en UI espeja `docs/pendientes` (no lee markdown en runtime).

## Archivos

- `RosverSac/server/src/lib/admin-dashboard.ts`
- `RosverSac/server/src/routes/admin-analytics.ts`
- `RosverSac/src/app/pages/AdminDashboardPage.tsx`
- `RosverSac/package.json` (v0.1.47)
- `docs/pendientes/PENDIENTES.md`
- `docs/pendientes/README.md`
- `docs/changes/0236-admin-inicio-dashboard.md`

## Cómo verificar

- [ ] Reiniciar API local (`npm run dev:server` o equivalente) y abrir `/admin` con sesión admin
- [ ] KPIs cargan sin error 500
- [ ] Barras de pipeline y últimos pedidos coinciden con `/admin/pedidos`
- [ ] Clic en Analítica / accesos rápidos navega bien
- [ ] Sección pendientes muestra P01, P04, P14, P22, P30, P53, P99, P129, P130
- [ ] _(UI)_ Móvil (&lt;768px): KPIs 2 columnas, sin overflow
- [ ] _(UI)_ Tablet (768–1023px): grillas legibles
- [ ] _(UI)_ Desktop (≥1024px): layout 5/3 columnas
- [ ] Animaciones GSAP respetan reduced-motion
