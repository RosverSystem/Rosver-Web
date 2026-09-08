# Cambio: SPA sin flash en /cuenta + refresh catálogo

**Fecha:** 2026-09-08  
**Tipo:** fix | perf  
**Versión:** 0.1.8

## Qué cambió

- Layout público con `<Outlet />` estable (navbar/footer no remontan en cada ruta).
- `PageTransition` y scroll-to-top usan clave por **sección** (`cuenta`, `catalogo`…): cambiar tabs de Mi cuenta ya no se siente como F5.
- `CatalogProvider` + `GET /api/catalog`: al entrar a catálogo/ofertas, al volver el foco a la pestaña y cada ~45s se pide catálogo vivo (hoy `live: false` → mocks).

## Por qué

Al cambiar Resumen/Pedidos/Cotizaciones, `key={pathname}` remountaba banner+layout con fade y el scroll saltaba al tope.

## Cómo

`routeShellKey(pathname)`; nested routes; provider con focus/visibility + poll. Cuando P10 publique productos, `live: true` actualizará la tienda sin F5.

## Archivos

- `RosverSac/src/app/App.tsx`
- `RosverSac/src/shared/ui/page-transition.tsx`
- `RosverSac/src/app/providers/SmoothScroll.tsx`
- `RosverSac/src/features/account/ui/AccountLayout.tsx`
- `RosverSac/src/features/catalog/model/catalog-store.tsx`
- `RosverSac/src/features/catalog/ui/{Catalog,Offers,Home,Product,Trending}*.tsx`
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/server/src/index.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/cuenta` → Cotizaciones → Pedidos: banner y header fijos; solo cambia el contenido
- [ ] Sin saltar al tope al cambiar tabs de cuenta
- [ ] `/ofertas` o `/catalogo`: botón/acción de refresco y focus de pestaña llaman `/api/catalog`
- [ ] Móvil / tablet / desktop OK
- [ ] Deploy Railway SUCCESS
