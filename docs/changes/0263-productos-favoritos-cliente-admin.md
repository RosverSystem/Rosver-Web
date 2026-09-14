# Cambio: Favoritos de producto (cliente + admin)

**Fecha:** 2026-09-14  
**Tipo:** feature  
**Versión:** 0.1.66

## Qué cambió

- Tabla `product_favorites` + API `/api/favorites` (listar, ids, add, toggle, delete).
- Feature `favorites`: provider, botón corazón, página `/cuenta/favoritos`.
- Corazón cableado en cards, trending, ficha de producto y navbar.
- Admin clientes: contador de favoritos + tab «Favoritos» en la ficha.

## Por qué

El corazón de la tienda no persistía nada; hacía falta lógica completa, vista cliente y visibilidad comercial por cliente en el dashboard.

## Cómo

- Persistencia por sesión (`user_id` + `product_id`), resolución por UUID o slug.
- Store front sincroniza IDs al login; toggle optimiza UX con toasts tipados.
- Admin reutiliza `listFavorites` / `countFavorites` en el detalle de cliente.

## Archivos

- `RosverSac/server/sql/043_product_favorites.sql`
- `RosverSac/server/src/lib/product-favorites.ts`
- `RosverSac/server/src/routes/favorites.ts`
- `RosverSac/server/src/lib/admin-clients.ts`
- `RosverSac/src/features/favorites/**`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/admin-clients/**`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/features/favorites.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Login cliente → corazón en catálogo → toast y badge navbar
- [ ] `/cuenta/favoritos` lista el producto; quitar corazón lo saca
- [ ] `/admin/clientes` muestra Favs; detalle → tab Favoritos
- [ ] Sin sesión el corazón redirige a login
- [ ] Móvil / tablet / desktop
- [ ] Deploy Railway responde; migración 043 aplicada en boot
- [ ] Preferir `railway redeploy --from-source` (GitHub); `railway up` local falló en Metal builder (app source dir)
