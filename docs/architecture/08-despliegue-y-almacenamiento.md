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

- **Proyecto / servicio:** pendiente de primer `railway up` (token CLI inválido hasta ahora)
- **Root directory:** `RosverSac`
- **Build:** `npm ci && npm run build`
- **Start:** `npx --yes serve -s dist -l $PORT` (`railway.toml`)
- **Script deploy:** `scripts/railway-deploy.ps1` / `scripts/railway-deploy.sh`
- **Postgres:** `railway add --database postgres` → `DATABASE_URL` (backend futuro; no al front)

### Cómo obtener `RAILWAY_TOKEN` válido

1. Entra a https://railway.app/account/tokens  
2. **Create Token** → Account Token  
3. Copia el token (suele ser largo, **no** es el UUID del proyecto)  
4. Pégalo en `.env` → `RAILWAY_TOKEN=...`  
5. Ejecuta `.\scripts\railway-deploy.ps1` o pide al agente que despliegue

### Variables en el servicio web (Railway dashboard)

Ver `RosverSac/.env.railway.example`. En fase visual la SPA **no** necesita keys R2 ni `DATABASE_URL` en el browser.  
`DATABASE_URL` la usa solo un servicio API futuro. R2 keys solo en backend / local `.env`.

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
