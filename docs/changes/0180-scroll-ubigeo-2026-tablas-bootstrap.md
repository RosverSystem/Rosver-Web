# Cambio: Scroll nested global + ubigeo 2026 + tablas Bootstrap

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Lenis con `allowNestedScroll`: la rueda mueve primero el dropdown/lista y al límite sigue la página.
- Aplicado en: selects ubigeo, sugerencias de dirección, buscador de productos (cotizar/carrito), buscador navbar, buscador admin.
- Ubigeo actualizado a padrón **2026** (25 / 196 / 1873) + reseed Postgres.
- Script `npm run db:build-ubigeo` para regenerar JSON.
- Tablas admin con API Bootstrap (`BootstrapTable` + clases `table-*`) y tokens Rosver.

## Por qué

La rueda solo bajaba la página; el padrón ubigeo debía ser 2026; tablas admin sin patrón unificado.

## Cómo

- `attachNestedScrollWheel` + `data-lenis-prevent` en listas.
- Fuente: open-admin-data `peru-administrative-divisions` (actualizado 2026-06-28).
- No se importa Bootstrap CSS completo (rompe Tailwind); sí las clases `table` / `table-striped` / `table-hover`.

## Archivos

- `RosverSac/src/app/providers/SmoothScroll.tsx`
- `RosverSac/src/shared/lib/nested-scroll-wheel.ts`
- `RosverSac/src/shared/ui/select-combobox.tsx`
- `RosverSac/src/shared/ui/peru-address-suggest.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/app/layout/admin/AdminTopBar.tsx`
- `RosverSac/server/data/ubigeo/*`
- `RosverSac/server/scripts/build-ubigeo-2026.mjs`
- `RosverSac/server/src/seed-ubigeo.ts`
- `RosverSac/src/shared/ui/bootstrap-table.tsx`
- `RosverSac/src/styles/global.css`
- Admin: usuarios, audit, cotizaciones, pedidos

## Cómo verificar

- [ ] `/cotizar` → Elegir a mano → Departamento: rueda baja la lista; al final baja la página
- [ ] Buscador productos: misma lógica de rueda
- [ ] Selects muestran ubigeo 2026 (p. ej. 1873 distritos al seed)
- [ ] `/admin/usuarios` tabla con estilo striped/hover tipo Bootstrap
- [ ] Móvil / tablet / desktop
