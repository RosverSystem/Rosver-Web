# Despliegue y almacenamiento — Rosver-Web

Infra de la web **Rosver SAC** y del ERP **SystemRSV**. Actualizar este archivo en cada deploy o cambio de servicio.

---

## 1. Entornos

| Entorno | Host | App | Notas |
| --- | --- | --- | --- |
| Local | `localhost:5173` | Vite dev | `cd RosverSac && npm run dev` |
| Producción (web) | Railway | SPA estática (`RosverSac` build) | Pestaña: Rosver SAC / SystemRSV según ruta |
| Base de datos | Railway Postgres | — | Fase lógica (aún no cableada a la UI) |
| Objetos (media) | Cloudflare R2 | Buckets S3-compatibles | Imágenes, PDFs, adjuntos |

---

## 2. Railway (web + Postgres)

| Recurso | ID / valor |
| --- | --- |
| Proyecto | `rosver-web` (`325c8738-10e7-4be6-bdd4-41d19848fb1f`) |
| Entorno | `production` |
| Servicio web (GitHub) | `Rosver-Web` (`0bb3658a-7121-4bc4-b492-0ee2d0938228`) |
| Repo | `RosverSystem/Rosver-Web` · root `RosverSac` |
| URL pública (SPA) | https://rosver-web-production.up.railway.app (servicio `Rosver-Web`) |
| Dominio (servicio vacío `web`) | `web-production-e1349.up.railway.app` — no usar; limpiar en dashboard |
| Postgres | servicio `Postgres` (`058b448f-…`) — verificar volumen/health |

- **Root directory:** `RosverSac`
- **Node:** `22` (`nixpacks.toml` + `NIXPACKS_NODE_VERSION`) — Vite 8 no corre en Node 18
- **Build:** `npm run build` (Nixpacks ya hace `npm ci`; no repetirlo → evita `EBUSY` en `node_modules/.cache`)
- **Start:** `npx --yes serve@14 -s dist -l tcp://0.0.0.0:$PORT`
- **Config en repo:** `RosverSac/railway.toml`, `RosverSac/nixpacks.toml`
- **Token:** workspace token en `.env` → `RAILWAY_TOKEN` (GraphQL API; CLI `whoami` puede seguir Unauthorized)
- **Script deploy:** `scripts/railway-deploy.ps1` / `.sh` (si el CLI acepta el token)

### Variables en el servicio web

- `NIXPACKS_NODE_VERSION=22`
- `NODE_ENV=production`
- Fase visual: **no** poner R2 ni `DATABASE_URL` en `VITE_*` / browser.
- Ver `RosverSac/.env.railway.example`.

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
| Visual (actual) | Sí — mocks | Crear instancia; sin ORM aún | Preparar buckets; sin upload en UI aún |
| Lógica | API + auth | Modelos / migraciones | Upload productos, docs, leads |
