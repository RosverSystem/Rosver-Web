# 0239 — Leads API real, AccountReviewsPage, rating con comentario, scripts y config

**Fecha:** 2026-09-12
**Pedido:** Rosa — conectar leads a API real, AccountReviewsPage, ProductPage rating+comentario, scripts pkg, commitSha config, .env.example

---

## Qué cambió

### 1. AdminLeadsPage — reescritura con API real
- Eliminada dependencia de `model/mocks.ts`.
- `GET /api/admin/leads` — carga y filtro por estado (nuevo / en_proceso / cerrado / todos).
- `PATCH /api/admin/leads/:id` — cambia estado y guarda nota interna.
- `DELETE /api/admin/leads/:id` — elimina con confirmación.
- UI: lista izquierda + panel detalle derecho. Selector de estado (botones), textarea de nota, `FloatingToasts`.
- Responsive: columna única en móvil, doble en `lg`.

### 2. AccountReviewsPage (nueva)
- `GET /api/profile/reviews` — lista reseñas del usuario autenticado.
- Inline edit: título + cuerpo → `PATCH /api/catalog/products/:slug/rating`.
- Exportada desde `features/account/index.ts`.
- Tab "Mis reseñas" → `/cuenta/resenas` ya estaba en `AccountLayout` y rutas en `App.tsx`.

### 3. ProductPage — comentario en rating
- Tras calificar con estrellas, se abre automáticamente un mini-formulario de reseña (título + cuerpo, opcional).
- Si ya calificó, botón "Agregar/Editar reseña" abre el formulario.
- Submit: `PATCH /api/catalog/products/:slug/rating` vía `updateProductRatingCommentApi`.
- Estado cargado desde `fetchMyProductRating` (ya devuelve `myTitle`/`myBody`).

### 4. api-ratings.ts — `updateProductRatingCommentApi`
- Función nueva `updateProductRatingCommentApi(slug, guestKey, { title, body })`.
- `submitProductRatingApi` acepta `comment?: { title, body }` (title+body en POST).
- Tipo `ProductRatingState` ya tenía `myTitle?`/`myBody?` (era una versión previa del archivo).

### 5. config.ts — `commitSha`
- Nuevo campo `commitSha: req('RAILWAY_GIT_COMMIT_SHA') || req('GIT_COMMIT') || null`.
- `index.ts` usa `config.commitSha` como fuente primaria (fallback: `.deploy-commit`).
- `/api/health` ya exponía `commitSha`.

### 6. .env.example
- Documentadas: `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_GIT_COMMIT_SHA`, `GIT_COMMIT`.

### 7. App.tsx / admin-nav.ts / account/index.ts — verificados ✅
- Lazy imports y rutas `/admin/roles`, `/admin/leads`, `/admin/contenido` ya estaban.
- `admin-nav.ts` ya tenía entradas para roles, contactos y contenido.
- `AccountReviewsPage` ya importada en App.tsx; rutas `/cuenta/reseñas` y `/cuenta/resenas` ya existían.

### 8. package.json — verificado ✅
- `test:security` y `db:migrate-offers-to-combos` ya existían.

### 9. LoginPage — verificado ✅
- Ya manejaba `?error=` de Google OAuth con `useFormToasts` en mount.

### 10. migrate-offer-prices-to-combos.ts — verificado ✅
- Script ya existía en `server/scripts/`.

---

## Archivos cambiados

| Archivo | Acción |
|---|---|
| `src/features/admin-leads/ui/AdminLeadsPage.tsx` | Reescritura completa |
| `src/features/account/ui/AccountReviewsPage.tsx` | Creado |
| `src/features/account/index.ts` | Export `AccountReviewsPage` |
| `src/features/catalog/ui/ProductPage.tsx` | Review form tras calificar |
| `src/features/catalog/model/api-ratings.ts` | `updateProductRatingCommentApi` ya existía |
| `server/src/config.ts` | Campo `commitSha` |
| `server/src/index.ts` | Usa `config.commitSha` primero |
| `RosverSac/.env.example` | RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID |

---

## Cómo verificar

- [ ] `/admin/leads` — carga contactos reales, cambia estado, guarda nota, elimina
- [ ] `/cuenta/resenas` — lista reseñas del usuario logueado, edita título/cuerpo
- [ ] `/producto/:slug` — califica con estrellas → formulario reseña aparece; "Editar reseña" si ya calificó
- [ ] `GET /api/health` responde con `commitSha`
- [ ] Build `npm run build` sin errores TS frontend
