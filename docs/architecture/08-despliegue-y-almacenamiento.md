# Despliegue y almacenamiento — Rosver-Web

Infra de la web **Rosver SAC** y del ERP **SystemRSV**. Actualizar este archivo en cada deploy o cambio de servicio.

---

## 1. Entornos

| Entorno | Host | App | Notas |
| --- | --- | --- | --- |
| Local | `localhost:5173` + API `:8787` | Vite + `npm run dev:api` | Proxy `/api` en Vite |
| Producción (web+api) | Railway | SPA `dist` + Hono `/api` mismo servicio | https://rosver-web-production.up.railway.app |
| Base de datos | Railway Postgres | Online | Template oficial; migrate/seed en boot |
| Objetos (media) | Cloudflare R2 | Buckets S3-compatibles | Imágenes, PDFs, adjuntos |

---

## 2. Railway (web + Postgres)

| Recurso | ID / valor |
| --- | --- |
| Proyecto | `rosver-web` (`325c8738-10e7-4be6-bdd4-41d19848fb1f`) |
| Entorno | `production` |
| Servicio web+api (GitHub) | `Rosver-Web` (`0bb3658a-7121-4bc4-b492-0ee2d0938228`) |
| Repo | `RosverSystem/Rosver-Web` · root `RosverSac` |
| URL pública | https://rosver-web-production.up.railway.app |
| Health API | https://rosver-web-production.up.railway.app/api/health |
| Postgres | `Postgres` (`d07bb6a5-395a-4fe8-a092-e9ef6d906006`) · **Online** |
| TCP proxy Postgres | `altaria.proxy.rlwy.net:17586` → `:5432` (solo admin/local) |

- **Root directory:** `RosverSac`
- **Node:** `22`
- **Build:** `npm run build`
- **Start:** `npx tsx server/src/boot.ts` (migrate → seed upsert → Hono sirve `dist` + `/api`)
- **Config:** `RosverSac/railway.toml`, `nixpacks.toml`
- **Auth seed:** admin `admin@multiserviciosmta.site` · cliente `acosta.wp076@gmail.com` (passwords en variables Railway / `.env` local)

### Variables en el servicio web (`Rosver-Web`)

- `NIXPACKS_NODE_VERSION=22`
- `NODE_ENV=production`
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (sin `DATABASE_PUBLIC_URL` en prod)
- `APP_URL` / `CORS_ORIGIN` = `https://rosver-web-production.up.railway.app`
- `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM`
- `SEED_ADMIN_PASSWORD` / `SEED_CLIENT_PASSWORD`
- Google (opcional): `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `GOOGLE_REDIRECT_URI`
- R2: `R2_ENDPOINT` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET_PUBLIC` (`R2_PUBLIC_BASE_URL` opcional)
- **No** poner secretos en `VITE_*` (misma origen: front usa `/api` relativo)

### Migraciones (continuo)

- Archivos: `RosverSac/server/sql/NNN_slug.sql` (`001_auth_rbac`, `002_catalog_core`, …).
- Boot (`server/src/boot.ts`) ejecuta `migrate.ts` → aplica **todos** los `NNN_*.sql` en orden.
- Regla: **cada feature/API que necesite DB lleva su migración en el mismo cambio** (`.cursor/rules/15-database-migraciones.mdc`).
- No reescribir migraciones ya desplegadas de forma incompatible: añadir `003_…` con `ALTER`.
---

## 3. Cloudflare R2 — estado configurado

**Account ID:** en `.env` → `CLOUDFLARE_ACCOUNT_ID`  
**API Token Cursor:** verificado *active* (expira ~2027-02-27)

### Buckets

| Bucket | Uso | Estado |
| --- | --- | --- |
| `rosver-public-media` | Imágenes / banners públicos | Creado · CORS GET/HEAD `*` |
| `rosver-private-docs` | PDFs / adjuntos privados | Creado |
| `rosverimg` | Legacy (ya existía) | Presente |

**Endpoint S3:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### Credenciales S3 (locales)

Guardadas en `.env` (gitignored):

- `CLOUDFLARE_R2_ACCOUNT_TOKEN` (`cfat_…`)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`

Verificado 2026-09-08: `ListBuckets` + `PutObject` healthcheck en `rosver-public-media/_healthcheck/rosver.txt`.

### Qué guardar ahí

| Sí | No |
| --- | --- |
| Fotos de producto, banners | Código, `.env`, tokens |
| PDFs cotización / fichas | Passwords / keys |
| Adjuntos de leads | Datos estructurados → Postgres |
---

## 5. Versiones

- App: `RosverSac/package.json` → campo `version`.
- Cada release / deploy → `docs/changes/NNNN-*.md` (regla `11-despliegues-versiones`).

### Historial de deploys (resumen)

| Fecha | Versión | Qué | URL / notas |
| --- | --- | --- | --- |
| 2026-09-07 | 0.1.0 | Primer deploy Railway + docs R2/Postgres | (actualizar tras deploy) |

---

## 6. Relación con fase del producto

| Fase | Web | Postgres | R2 |
| --- | --- | --- | --- |
| Visual (actual) | Sí — mocks | Auth + seed online | Avatares vía API → R2; productos aún mock |
| Lógica | API + auth | Modelos / migraciones | Upload productos, docs, leads |
