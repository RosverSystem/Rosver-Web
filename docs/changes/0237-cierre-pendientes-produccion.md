# Cambio: Cierre de pendientes de implementación (auditoría producción)

**Fecha:** 2026-09-12  
**Tipo:** feature | fix | docs

## Qué cambió

- **P14:** `railway-deploy.ps1` / `.sh` resuelven `git rev-parse HEAD`, escriben `.deploy-commit`, `--ci`, redeploy GraphQL opcional con `commitSha`; `/api/health` expone `commitSha`.
- **P28:** Documentado en `08` — Redis es caché 90s + rate-limit; **sin volumen obligatorio**.
- **P30:** Comentarios en reseñas (sanitización XSS, PATCH rating, `GET /api/profile/reviews`, UI `/cuenta/resenas`).
- **P01:** Cookie OAuth `Secure` en prod, `assertGoogleOAuthState`, tests sin credenciales, `.env.example` Google, toasts de error en login.
- **P04:** UI `/admin/roles` + DELETE roles no-sistema; nav Roles.
- **P22:** Import CSV `rosver-csv-v1` (sin romper ELFA/JSON).
- **P53:** Leads reales (`contact_messages` + status), Contenido `site_content` + UI.
- **P129:** Tabla `product_promos`, motor BOGO server-side en pedidos/cotizaciones, `GET /api/catalog/promos`.
- **P130:** Script `migrate-offer-prices-to-combos.ts` (dry-run / `--apply`); 3 ofertas migradas en local.
- **P99:** CORS multi-origen + www↔apex, `COOKIE_DOMAIN`, checklist cutover; DNS sigue **BLOQUEADO EXTERNO**.
- Fix regresión: `showErrors` acepta `string[]` otra vez; restore `AdminOffersPage` + sección UI **Promociones 2×1** (`GET/POST/PATCH/DELETE /api/admin/promos`); TS build OK.

## Por qué

Pedido: eliminar pendientes reales con evidencia, sin marcar “hecho” vacío.

## Cómo

Migraciones `040`–`041`; libs `pricing-security`, `product-promos`, `product-ratings`; rutas admin leads/content/promos/roles; scripts de test y migración.

## Archivos

- `scripts/railway-deploy.ps1`, `scripts/railway-deploy.sh`
- `RosverSac/server/sql/040_*.sql`, `041_*.sql`
- `RosverSac/server/src/lib/{pricing-security,product-promos,product-ratings,admin-dashboard}.ts`
- `RosverSac/server/src/routes/{admin-leads,admin-content,admin-promos,catalog,auth,orders,quotes}.ts`
- `RosverSac/src/features/{admin-users,admin-leads,admin-content,account}/**`
- `docs/pendientes/*`, `docs/architecture/08-*.md`

## Cómo verificar

- [x] `npm run test:security` PASS
- [x] `npm run test:oauth-state` PASS
- [x] Migraciones 040–041 aplicadas local
- [x] Dry-run + `--apply` migrate offers (3 combos)
- [x] `npx tsc -b` OK
- [ ] `npm run build` (ejecutar)
- [ ] `/admin/roles`, `/admin/leads`, `/admin/contenido`, `/cuenta/resenas`
- [ ] BLOQUEADO EXTERNO: Google Cloud keys (P01) + DNS Cloudflare→Railway (P99)
