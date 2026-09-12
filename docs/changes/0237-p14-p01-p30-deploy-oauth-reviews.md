# Cambio: Deploy commit SHA · Google OAuth polish · Reseñas comentarios

**Fecha:** 2026-09-12  
**Tipo:** feature + fix

---

## P14 — Forzar commitSha en scripts de deploy

### Qué cambió

- `scripts/railway-deploy.ps1` y `scripts/railway-deploy.sh`: resuelven `git rev-parse HEAD` antes de desplegar; fallan si no hay repositorio git. Advierten (no fallan) si el árbol está sucio. Escriben el SHA en `RosverSac/.deploy-commit`.
- `server/src/boot.ts`: lee el SHA desde `RAILWAY_GIT_COMMIT_SHA` → `GIT_COMMIT` → `.deploy-commit` y lo imprime al arrancar.
- `server/src/index.ts`: expone `commitSha` en `GET /api/health`.

### Archivos

- `scripts/railway-deploy.ps1`
- `scripts/railway-deploy.sh`
- `RosverSac/server/src/boot.ts`
- `RosverSac/server/src/index.ts`

### Cómo verificar

- [ ] Ejecutar `scripts/railway-deploy.ps1` → imprime `==> Commit SHA: <sha>` y escribe `RosverSac/.deploy-commit`
- [ ] Arrancar servidor local → log `[boot] commitSha=<sha>`
- [ ] `GET /api/health` devuelve `{ commitSha: "<sha>" }`
- [ ] Con árbol sucio → advertencia visible pero el deploy continúa
- [ ] Sin repo git → el script falla con mensaje claro

---

## P01 — Google OAuth polish

### Qué cambió

- `RosverSac/.env.example`: añadidas variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (comentadas, sin secretos reales).
- `server/src/routes/auth.ts`: cookie `google_oauth_state` ya incluía `Secure` en producción (confirmado — estaba implementado). Sin cambio adicional.
- `server/src/lib/oauth-state.ts` (nuevo): función pura `assertGoogleOAuthState(cookie, queryState)` + tipo `OAuthStateResult` + mensajes `OAUTH_STATE_MESSAGES`. Sin dependencias de Hono/DB.
- `server/scripts/test-oauth-state.mjs` (nuevo): 7 tests unitarios para `assertGoogleOAuthState`, corren con `node` sin credenciales.
- `RosverSac/package.json`: script `"test:oauth-state"` → `node server/scripts/test-oauth-state.mjs`.
- `src/features/auth/ui/LoginPage.tsx`: lee `?error=` en el callback de Google y muestra toast apropiado (`showWarning` para `google_not_configured`/`disabled`, `showErrors` para el resto). Limpia el param de la URL sin navegar.

### Archivos

- `RosverSac/.env.example`
- `RosverSac/server/src/lib/oauth-state.ts` ← nuevo
- `RosverSac/server/scripts/test-oauth-state.mjs` ← nuevo
- `RosverSac/package.json`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`

### Cómo verificar

- [ ] `npm run test:oauth-state` → 7 tests pasados
- [ ] Visitar `/login?error=google_state` → toast de error visible; URL queda limpia
- [ ] Visitar `/login?error=google_not_configured` → toast de warning (no rojo)
- [ ] Visitar `/login?error=google_denied` → toast informativo
- [ ] `.env.example` contiene las tres variables comentadas

---

## P30 — Comentarios en reseñas de productos

### Qué cambió

**Server:**

- `server/src/lib/product-ratings.ts`:
  - `submitProductRating` acepta `title` (≤120 chars) y `body` (≤2000 chars) opcionales; los sanitiza (strip HTML, null bytes, trim).
  - Nueva función `updateProductRatingComment` — actualiza solo title/body de una reseña existente (las estrellas no cambian). Devuelve `{ok: false, code: 'missing'}` si no hay reseña previa.
  - Nueva función `getMyProductRatingFull` (alias `getMyProductRatingDetail`) — devuelve `{rating, title, body}`.
  - Nueva función `getUserReviews` (alias `listUserReviews`) — lista reseñas del usuario con `id`, `productName`, `productSlug`, `imageUrl`, `rating`, `title`, `body`, `createdAt`, `updatedAt`.

- `server/src/routes/catalog.ts` (ya actualizado):
  - `rateSchema` incluye `title` y `body`.
  - `GET /api/catalog/products/:slug/rating` devuelve `myTitle` y `myBody`.
  - `PATCH /api/catalog/products/:slug/rating` — actualiza solo el comentario (sin cambiar estrellas). Auth o `guestKey`.

- `server/src/routes/profile.ts` (ya actualizado):
  - `GET /api/profile/reviews` — lista reseñas del usuario logueado.

**Frontend:**

- `src/features/account/ui/AccountReviewsPage.tsx` — página con lista de reseñas del usuario: muestra estrellas (no editables), título y comentario; botón "Editar comentario" / "Añadir comentario" despliega formulario en línea (title + textarea); guarda con PATCH al servidor.
- `src/features/account/ui/AccountLayout.tsx` — añade tab "Reseñas" → `/cuenta/reseñas`.
- `src/features/account/index.ts` — exporta `AccountReviewsPage`.
- `src/app/App.tsx` — ruta `cuenta/reseñas` → `<AccountReviewsPage />`.

### Archivos

- `RosverSac/server/src/lib/product-ratings.ts`
- `RosverSac/server/src/routes/catalog.ts`
- `RosverSac/server/src/routes/profile.ts`
- `RosverSac/src/features/account/ui/AccountReviewsPage.tsx`
- `RosverSac/src/features/account/ui/AccountLayout.tsx`
- `RosverSac/src/features/account/index.ts`
- `RosverSac/src/app/App.tsx`

### Migración de BD

No requerida — `product_reviews.title` y `.body` ya existen con `DEFAULT ''` desde `005_trending_ratings.sql`.

### Cómo verificar

**Backend:**
- [ ] `GET /api/catalog/products/:slug/rating` devuelve `{ myTitle, myBody }` para usuario con reseña
- [ ] `POST /api/catalog/products/:slug/rating` con `{ rating:4, title:"Bueno", body:"Cumple" }` → guarda title y body
- [ ] `PATCH /api/catalog/products/:slug/rating` con `{ title:"Actualizado" }` → actualiza solo el comentario, no las estrellas
- [ ] `PATCH` con slug sin reseña del usuario → 404
- [ ] `GET /api/profile/reviews` (logueado) → lista reseñas del usuario con campos correctos

**Frontend:**
- [ ] Ir a `/cuenta/reseñas` → se ve el tab "Reseñas" en la navegación del área cliente
- [ ] Sin reseñas → mensaje vacío + link al catálogo
- [ ] Con reseñas → lista con estrellas, título y comentario
- [ ] Clic en "Editar comentario" → formulario inline con título y textarea (contadores de chars)
- [ ] Guardar → toast "Comentario guardado." y el comentario se actualiza en pantalla
- [ ] Cancelar → formulario se cierra sin guardar
- [ ] Se ve correctamente en **móvil** (<768px)
- [ ] Se ve correctamente en **tablet** (768–1023px)
- [ ] Se ve correctamente en **desktop** (≥1024px)
