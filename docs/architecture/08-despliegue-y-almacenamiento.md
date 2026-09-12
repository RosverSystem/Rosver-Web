# Despliegue y almacenamiento — Rosver-Web

Infra de la web **Rosver SAC** y del ERP **SystemRSV**. Actualizar este archivo en cada deploy o cambio de servicio.

---

## 1. Entornos

| Entorno | Host | App | Notas |
| --- | --- | --- | --- |
| Local (activo ahora) | `localhost:5173` + API `:8787` | Vite + `npm run dev:api` | Proxy `/api` en Vite; desarrollo diario |
| Producción (web+api) | Railway | SPA `dist` + Hono `/api` mismo servicio | URL Railway actual: https://rosver-web-production.up.railway.app |
| Dominio canónico (prod) | **rosversac.com** | Cloudflare CDN → Railway | Documentado; cutover DNS/CDN pendiente (ver §4) |
| Base de datos (prod) | Railway Postgres | Online | Template oficial; migrate/seed en boot |
| Base de datos (local) | PostgreSQL 18 en Windows | `rosver_local` | Ver §1.1; `npm run db:setup` |
| Caché | Railway Redis | Online | Destacados home (`ioredis` + `REDIS_URL`) |
| Objetos (media) | Cloudflare R2 | Buckets S3-compatibles | Imágenes, PDFs, adjuntos |

### 1.1 Postgres local (desarrollo)

Requisito: PostgreSQL instalado y servicio `postgresql-x64-18` (u otro) en marcha.

| Dato | Valor |
| --- | --- |
| Host | `localhost:5432` |
| Database | `rosver_local` |
| User | `rosver` |
| Password | la del `.env` local (`DATABASE_URL`) — no commit |

```bash
cd RosverSac
# .env con DATABASE_URL=postgresql://rosver:…@localhost:5432/rosver_local
npm run db:setup   # migrate 001…NNN + seed admin/cliente + ubigeo Perú
npm run dev:api    # :8787
npm run dev        # :5173
```

- Postgres **local**; Redis + R2 pueden apuntar a Railway/Cloudflare (ver §1.2).
- El pool desactiva SSL si el host es `localhost` / `127.0.0.1` (`server/src/db.ts`).

### 1.2 Local + Redis Railway + R2 (híbrido)

Para desarrollar en local con caché/media reales:

| Servicio | Origen | Notas |
| --- | --- | --- |
| Postgres | Local `rosver_local` | No usar `DATABASE_URL` de Railway en este modo |
| Redis | Railway + **TCP proxy** | `REDIS_URL` / `REDISHOST`+`REDISPORT`+`REDISPASSWORD` en `.env` |
| R2 | Cloudflare | `R2_*` desde variables del servicio `Rosver-Web` |
| SMTP | Hostinger (vars Railway) | Opcional; OTP degrada a consola si falla |

- TCP proxy Redis (producción): `iriguchi.proxy.rlwy.net:37761` → `:6379` (crear vía GraphQL `tcpProxyCreate` si no existe).
- Token Railway en `.env`: **`RAILWAY_API_TOKEN`** con scope **Account** (ej. `RipWolfx-Laptop`). El CLI 5.50+ marca `RAILWAY_TOKEN` UUID como Invalid.
- Tokens con scope solo «Rosa's Projects» (ej. `cursor2`) no autentican igual para `me`/CLI.
- Proyecto local linkeado: `RosverSac/` → `rosver-web` / `production` / `Rosver-Web`.
- **Nunca** commitear `.env`.

---

## 2. Railway (web + Postgres)

| Recurso | ID / valor |
| --- | --- |
| Proyecto | `rosver-web` (`325c8738-10e7-4be6-bdd4-41d19848fb1f`) |
| Entorno | `production` |
| Servicio web+api (GitHub) | `Rosver-Web` (`0bb3658a-7121-4bc4-b492-0ee2d0938228`) |
| Repo | `RosverSystem/Rosver-Web` · root `RosverSac` |
| URL pública (Railway) | https://rosver-web-production.up.railway.app |
| Dominio canónico | **https://rosversac.com** (y `www`) — CDN Cloudflare pendiente de cutover |
| Health API | https://rosver-web-production.up.railway.app/api/health |
| Postgres | `Postgres` (`d07bb6a5-…`) · **Online** |
| Redis | `Redis` (`49da02e2-…`) · imagen `redis:7-alpine` · start: `sh -c 'redis-server --requirepass "$REDISPASSWORD" …'` |
| TCP proxy Postgres | `altaria.proxy.rlwy.net:17586` → `:5432` (solo admin/local) |
| TCP proxy Redis | `iriguchi.proxy.rlwy.net:37761` → `:6379` (local híbrido, 2026-09-09) |

- **Root directory:** `RosverSac`
- **Node:** `22`
- **Build:** `npm run build`
- **Start:** `npx tsx server/src/boot.ts` (migrate → seed upsert → seed ubigeo → Hono sirve `dist` + `/api`)
- **Config:** `RosverSac/railway.toml`, `nixpacks.toml`
- **Auth seed:** admin `admin@multiserviciosmta.site` · cliente `acosta.wp076@gmail.com` (passwords en variables Railway / `.env` local)
- **Ubigeo:** `npm run db:seed-ubigeo` (o vía boot) → 25 deptos / 196 provincias / 1873 distritos (padrón 2026) en `peru_*`

### Variables en el servicio web (`Rosver-Web`)

- `NIXPACKS_NODE_VERSION=22`
- `NODE_ENV=production`
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (sin `DATABASE_PUBLIC_URL` en prod)
- `REDIS_URL` = `redis://:${{Redis.REDISPASSWORD}}@${{Redis.RAILWAY_PRIVATE_DOMAIN}}:6379` (sin usuario `default`; `requirepass` de alpine)
- `APP_URL` / `CORS_ORIGIN` — hoy Railway: `https://rosver-web-production.up.railway.app`  
  - **Tras cutover dominio:** ambos = `https://rosversac.com` (incluir `www` en CORS si se usa)
- `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` `SMTP_SECURE`
  - Preferir **587** + `SMTP_SECURE=false` (STARTTLS). En varias redes el **465** hace `ETIMEDOUT`; el código intenta fallback 587 si el primario era 465.
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
| JSON de importaciones de productos (`imports/products/…` en **privado**) | — |

---

## 4. Dominio canónico + CDN (Cloudflare)

| Dato | Valor |
| --- | --- |
| Dominio de producto | **rosversac.com** |
| Estado | **Documentado**; trabajo diario sigue en **local** (`localhost:5173` / `:8787`) |
| CDN | Cloudflare plan **Free** (proxy naranja) delante de Railway |
| Media | Sigue en **R2** (no en el VPS/Railway disco) |
| Host app/API/DB | Railway (deploy fácil vía GitHub) |

### Stack de despliegue acordado

```
Usuario → Cloudflare CDN (rosversac.com)
              → Railway (SPA + Hono + Postgres + Redis)
Fotos/PDFs → Cloudflare R2
```

### Checklist cutover (cuando se active el dominio)

> **⚠ BLOQUEADO EXTERNO** — los pasos de DNS y Railway custom domain requieren acceso al panel de Cloudflare y a Railway. No se pueden completar desde el código; hay que hacerlo manualmente.

#### Paso 1 — Cloudflare: añadir sitio

1. [ ] Ir a [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site** → `rosversac.com` → plan Free.
2. [ ] Cloudflare mostrará los **nameservers** que debe usar el registrador (ej. `alma.ns.cloudflare.com`).
3. [ ] En el panel del **registrador del dominio** (GoDaddy, Namecheap, etc.) → cambiar NS al par que Cloudflare indicó.
4. [ ] Esperar propagación (minutos a 48 h). Verificar con: `nslookup rosversac.com` → debe resolver a IPs de Cloudflare.

#### Paso 2 — DNS en Cloudflare (tras añadir el sitio)

5. [ ] En Cloudflare → DNS → **Add record**:
   - Tipo `CNAME` · Nombre `@` (apex) · Destino `rosver-web-production.up.railway.app` · **Proxy: ☁ naranja (CDN ON)**
   - Tipo `CNAME` · Nombre `www` · Destino `rosver-web-production.up.railway.app` · **Proxy: ☁ naranja (CDN ON)**

#### Paso 3 — Railway: Custom Domain

6. [ ] En [railway.app](https://railway.app) → proyecto `rosver-web` → servicio `Rosver-Web` → **Settings → Domains → Add Custom Domain**.
7. [ ] Añadir `rosversac.com` y `www.rosversac.com`.
8. [ ] Railway mostrará el valor `CNAME` destino (confirmar que coincide con `rosver-web-production.up.railway.app`).
9. [ ] Railway emitirá el certificado TLS automáticamente (Let's Encrypt).

#### Paso 4 — SSL/TLS Cloudflare

10. [ ] Cloudflare → SSL/TLS → modo **Full (strict)** (Railway ya tiene cert válido).
11. [ ] Edge Certificates → **Always Use HTTPS: ON**.
12. [ ] Habilitar **HSTS** (opcional pero recomendado): max-age ≥ 6 meses.

#### Paso 5 — Cache rules (Cloudflare)

13. [ ] Cache Rules → crear regla: `URI path starts with /api` → **Bypass cache**.
14. [ ] Cache Rules → crear regla: `URI path contains /admin` → **Bypass cache**.
15. [ ] Estáticos (`/assets/*`, `*.js`, `*.css`, `*.woff2`) → cache con TTL largo (Cloudflare defaults bastan).

#### Paso 6 — Variables Railway

16. [ ] En Railway → Variables del servicio `Rosver-Web`:
   ```
   APP_URL=https://rosversac.com
   CORS_ORIGINS=https://rosversac.com,https://www.rosversac.com
   CORS_ORIGIN=https://rosversac.com
   ```
   (`CORS_ORIGINS` incluye automáticamente las variantes www ↔ apex en el código; aun así conviene ponerlas explícitas.)

#### Paso 7 — Verificación post-cutover

17. [ ] `curl https://rosversac.com/api/health` → `{"ok":true,...}`.
18. [ ] SPA: home, login, catálogo, `/admin` → sin 404.
19. [ ] Media R2 se sirve (imágenes en catálogo carguen).
20. [ ] Cookie de sesión se establece correctamente (login → área cliente).
21. [ ] (Opcional) `COOKIE_DOMAIN=.rosversac.com` en Railway si se usan subdominios con sesión compartida.
22. [ ] (Opcional) Analytics Cloudflare → Web Analytics → pegar snippet o activar Zaraz.

Hasta completar el checklist, la URL pública operativa sigue siendo la de Railway; desarrollo en local.

---

## 5. Versiones

- App: `RosverSac/package.json` → campo `version`.
- Cada release / deploy → `docs/changes/NNNN-*.md` (regla `11-despliegues-versiones`).

### Historial de deploys (resumen)

| Fecha | Versión | Qué | URL / notas |
| --- | --- | --- | --- |
| 2026-09-07 | 0.1.0 | Primer deploy Railway + docs R2/Postgres | (actualizar tras deploy) |

---

## P28 resolución — Redis: caché efímera, sin persistencia obligatoria

**Decisión de diseño (2026-09-12):** Redis en este proyecto es **solo caché de 90 s** y **rate-limits / lockouts**. No almacena datos de negocio ni sesiones de usuario (las sesiones viven en Postgres `sessions`).

### Implicaciones

| Pregunta | Respuesta |
| --- | --- |
| ¿Se pierde algo importante si Redis se reinicia? | No. Los datos vuelven a Postgres al primer request. El home carga 90 s más lento hasta que la caché se llene. |
| ¿Requiero volumen Railway persistente? | **No** — incorrecto por diseño. El `redis:7-alpine` sin volumen basta para caché + rate-limits. |
| ¿Y si Redis se cae durante un bloqueo de intentos fallidos? | El lockout sobrevive en Redis mientras el contenedor esté vivo. Al reiniciar, el lockout se pierde — **riesgo aceptado** para esta fase; si la seguridad lo exige en el futuro, añadir tabla `rate_limits` en Postgres. |
| ¿Necesito `railway.toml` con volumen? | Opcional — **solo** si en el futuro se decide persistir el lockout entre reinicios. Si se añade, documentar en `railway.toml` con comentario explicatorio. |

### Qué almacena Redis en Rosver

1. **`catalog:featured`** — lista de productos destacados, TTL 90 s.
2. **`catalog:trending`** — productos tendencia, TTL 90 s.
3. **`rate_limit:*`** — lockout de intentos de login (ioredis). Efímero por diseño.

### Invalidación

`invalidateCatalogHomeCaches()` en `server/src/lib/redis.ts` borra las claves de catálogo al guardar cambios en admin. Funciona correctamente con o sin persistencia.

**Estado:** ✅ Resuelto por diseño — no requiere acción adicional de infraestructura.

---

## 6. Relación con fase del producto

| Fase | Web | Postgres | R2 |
| --- | --- | --- | --- |
| Visual (actual) | Sí — mocks | Auth + seed online | Avatares vía API → R2; productos aún mock |
| Lógica | API + auth | Modelos / migraciones | Upload productos, docs, leads |
