# 0237 — P28/P99/P129/P130: Redis decisión, CORS multi-origen, promos BOGO, migración ofertas

**Fecha:** 2026-09-12  
**Versión:** 0.1.49  
**Autor:** Cursor (agente)

---

## Qué cambió

### P28 — Redis: caché efímera, sin volumen obligatorio

- `docs/architecture/08-despliegue-y-almacenamiento.md`: nueva sección **P28 resolución** que documenta que Redis almacena solo caché 90s + rate-limits; no requiere volumen Railway para correctitud; lockout efímero aceptado por diseño.

### P99 — Preparación de dominio rosversac.com

- **`server/src/config.ts`**: nueva función `buildCorsOrigins()` que construye un `Set<string>` desde `CORS_ORIGINS` (lista separada por comas), `CORS_ORIGIN` o `APP_URL`. Incluye automáticamente `www` ↔ apex si `APP_URL` o cualquier entrada es `rosversac.com`. Nueva propiedad `corsOrigins` (Set) y `cookieDomain` (opcional).
- **`server/src/index.ts`**: callback CORS actualizado para verificar contra `config.corsOrigins` (Set lookup) en lugar de comparación simple.
- **`server/src/lib/session.ts`**: `createSession` y la renovación deslizante ahora incluyen `domain: config.cookieDomain` en la cookie si `COOKIE_DOMAIN` está configurado.
- **`RosverSac/.env.example`**: ejemplos de producción para `CORS_ORIGINS`, `COOKIE_DOMAIN`, `APP_URL` con rosversac.com.
- **`docs/architecture/08`** §4: checklist de cutover expandido en 7 pasos con instrucciones exactas de Cloudflare DNS (CNAME apex+www, naranja), Railway custom domain, SSL Full (strict), Cache rules bypass `/api/*`, variables Railway. Marcado **BLOQUEADO EXTERNO** hasta verificar.

### P129 — Motor de promociones 2×1 (BOGO)

**Base de datos:**
- `server/sql/041_product_promos.sql`: tabla `product_promos` (id, product_id FK, packaging_id nullable, kind='bogo', buy_qty, pay_qty, active, valid_from, valid_to, notas, timestamps). Índices para lookup activo.

**Lib server:**
- `server/src/lib/product-promos.ts`:
  - `computeBogoPayableQty(qty, buyQty, payQty)` — fórmula: `floor(qty/buyQty)*payQty + qty%buyQty`
  - `priceLineWithPromo({ unitPrice, qty, promo })` → `{ payableQty, lineTotal, savings, hasPromo }`
  - `getActivePromosForProducts(productIds[])` — consulta DB con filtro de fechas
  - `applyPromosToItems(items[])` — aplica promos a un array de ítems de pedido/cotización
  - `getAllPromos()`, `createPromo()`, `updatePromo()`, `deletePromo()` — CRUD

**API:**
- `server/src/routes/admin-promos.ts`: CRUD admin bajo `/api/admin/promos` (GET, POST, PATCH /:id, DELETE /:id). Requiere rol admin.
- `server/src/routes/catalog.ts`: nuevo endpoint público `GET /api/catalog/promos` (promos activas y vigentes de productos visibles).
- `server/src/index.ts`: registradas las rutas de promos.

**Pedidos y cotizaciones (server-side truth):**
- `server/src/routes/orders.ts`: POST `/api/orders` llama `applyPromosToItems` antes de insertar; guarda ítems con `lineTotal` recalculado y `totalEstimated` real si hay promos.
- `server/src/routes/quotes.ts`: POST `/api/quotes` ídem.

**Frontend (display only):**
- `src/shared/lib/promo-utils.ts`: `computeBogoPayableQty` y `lineDisplayTotal` para cálculo visual (sin llamadas a DB).
- `src/features/cart/model/use-cart-promos.ts`: hook `useCartPromos()` que fetch `/api/catalog/promos` con caché in-memory 60s y `promosBySlug()` helper.
- `src/features/cart/ui/CartPage.tsx`: badge `2×1` amarillo en líneas de producto con promo activa; total y lineTotal ajustados visualmente; texto "Ahorras S/ X.XX" en verde.

**Admin UI:**
- `src/features/admin-catalog/ui/AdminOffersPage.tsx`: nueva sección "Promociones 2×1" al final de la página con grid de cards (badge, producto, fechas, toggle activa/inactiva) y `AdminModal` para crear/editar promos BOGO.

**Test:**
- `server/scripts/test-promo-calc.ts`: 16 casos de prueba para `computeBogoPayableQty` y `priceLineWithPromo`. Todos pasan. (`npm run test:promo-calc`)

### P130 — Migrar precios de oferta → combos

- `server/sql/042_product_price_migration_flag.sql`: añade columna `migrated_to_combo_id UUID REFERENCES offer_combos(id)` a `product_prices` (idempotente).
- `server/scripts/migrate-offer-prices-to-combos.ts`: script de migración idempotente con `--dry-run`. Busca `product_prices` con `price_kind='offer'` activos y no migrados → crea `offer_combo` de tipo `bundle_fixed` con el precio de oferta y un ítem (ese producto+empaque) → marca la fila original con `migrated_to_combo_id`. Probado en dry-run local: encontró 3 precios de oferta, crearía 3 combos.
- `package.json`: script `db:migrate-offers-to-combos` y `test:promo-calc`.

---

## Archivos modificados / creados

### Creados
- `server/sql/041_product_promos.sql`
- `server/sql/042_product_price_migration_flag.sql`
- `server/src/lib/product-promos.ts`
- `server/src/routes/admin-promos.ts`
- `server/scripts/migrate-offer-prices-to-combos.ts`
- `server/scripts/test-promo-calc.ts`
- `src/shared/lib/promo-utils.ts`
- `src/features/cart/model/use-cart-promos.ts`

### Modificados
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `server/src/config.ts`
- `server/src/index.ts`
- `server/src/lib/session.ts`
- `server/src/routes/catalog.ts`
- `server/src/routes/orders.ts`
- `server/src/routes/quotes.ts`
- `src/features/cart/ui/CartPage.tsx`
- `src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `RosverSac/.env.example`
- `package.json`

---

## Cómo verificar

- [ ] `npm run test:promo-calc` → 16 tests pasan
- [ ] `npm run db:migrate-offers-to-combos -- --dry-run` → muestra precios a migrar sin cambiar nada
- [ ] `npm run db:migrate` → aplica migraciones 041 y 042 sin error
- [ ] Admin → Ofertas → sección "Promociones 2×1" al final → crear promo 2x1 para un producto
- [ ] `GET /api/catalog/promos` → lista la promo creada
- [ ] Carrito → agregar producto con promo → ver badge "2×1" y "Ahorras S/ X"
- [ ] Crear pedido o cotización → total server-side refleja descuento BOGO
- [ ] `APP_URL=https://rosversac.com` + `CORS_ORIGINS=https://rosversac.com,https://www.rosversac.com` en `.env` → CORS OK para ambos orígenes
- [ ] `COOKIE_DOMAIN=.rosversac.com` → cookie con dominio compartido

---

## Pendientes actualizados

- P28: ✅ Resuelto por diseño
- P99: Código listo; DNS y Railway custom domain siguen BLOQUEADOS EXTERNAMENTE (requieren panel Cloudflare + Railway)
- P129: ✅ Completo
- P130: ✅ Script listo; ejecutar en producción con `npm run db:migrate` primero, luego sin `--dry-run`
